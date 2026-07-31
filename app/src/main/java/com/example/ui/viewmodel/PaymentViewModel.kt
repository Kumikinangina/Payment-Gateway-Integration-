package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.BillDetails
import com.example.data.model.PaymentMethod
import com.example.data.model.PaymentUiState
import com.example.data.model.TransactionReceipt
import com.example.data.repository.PaymentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

data class SavedAccount(
    val title: String,
    val accountNumber: String,
    val accountName: String,
    val defaultAmount: Double
)

class PaymentViewModel(
    private val repository: PaymentRepository = PaymentRepository()
) : ViewModel() {

    // Form inputs
    private val _accountNumber = MutableStateFlow("12-8849-2015")
    val accountNumber: StateFlow<String> = _accountNumber.asStateFlow()

    private val _accountName = MutableStateFlow("Maria Clara Santos")
    val accountName: StateFlow<String> = _accountName.asStateFlow()

    private val _amount = MutableStateFlow("1850.00")
    val amount: StateFlow<String> = _amount.asStateFlow()

    private val _selectedMethod = MutableStateFlow(PaymentMethod.GCASH)
    val selectedMethod: StateFlow<PaymentMethod> = _selectedMethod.asStateFlow()

    // Service Fee (e.g. PHP 15.00 for e-wallet processing)
    val serviceFee = 15.00

    // Form Validation Errors
    private val _accountNumberError = MutableStateFlow<String?>(null)
    val accountNumberError: StateFlow<String?> = _accountNumberError.asStateFlow()

    private val _accountNameError = MutableStateFlow<String?>(null)
    val accountNameError: StateFlow<String?> = _accountNameError.asStateFlow()

    private val _amountError = MutableStateFlow<String?>(null)
    val amountError: StateFlow<String?> = _amountError.asStateFlow()

    // Screen UI State
    private val _uiState = MutableStateFlow<PaymentUiState>(PaymentUiState.Form)
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    // Transaction History
    private val _paymentHistory = MutableStateFlow<List<TransactionReceipt>>(emptyList())
    val paymentHistory: StateFlow<List<TransactionReceipt>> = _paymentHistory.asStateFlow()

    // Saved Quick Accounts
    val savedAccounts = listOf(
        SavedAccount("Home Meter (San Francisco)", "12-8849-2015", "Maria Clara Santos", 1850.00),
        SavedAccount("Store Meter (Bayugan)", "15-3029-8812", "Santos General Store", 3420.75),
        SavedAccount("Farm Meter (Prosperidad)", "09-1102-4491", "Juan Dela Cruz", 980.00)
    )

    init {
        // Pre-populate sample historic transaction for rich UI experience
        val initialHistory = listOf(
            TransactionReceipt(
                transactionId = "TXN-PAYMONGO-984210",
                referenceNumber = "ASELCO-984210",
                accountNumber = "12-8849-2015",
                accountName = "Maria Clara Santos",
                billAmount = 1620.00,
                serviceFee = 15.00,
                totalPaid = 1635.00,
                paymentMethod = PaymentMethod.GCASH,
                timestampMs = System.currentTimeMillis() - (86400000 * 18), // 18 days ago
                status = "SUCCESSFUL"
            )
        )
        _paymentHistory.value = initialHistory
    }

    fun onAccountNumberChanged(value: String) {
        _accountNumber.value = value
        if (_accountNumberError.value != null) _accountNumberError.value = null
    }

    fun onAccountNameChanged(value: String) {
        _accountName.value = value
        if (_accountNameError.value != null) _accountNameError.value = null
    }

    fun onAmountChanged(value: String) {
        _amount.value = value
        if (_amountError.value != null) _amountError.value = null
    }

    fun onMethodSelected(method: PaymentMethod) {
        _selectedMethod.value = method
    }

    fun applySavedAccount(account: SavedAccount) {
        _accountNumber.value = account.accountNumber
        _accountName.value = account.accountName
        _amount.value = String.format("%.2f", account.defaultAmount)
        _accountNumberError.value = null
        _accountNameError.value = null
        _amountError.value = null
    }

    fun validateAndProceed() {
        var isValid = true

        val accNum = _accountNumber.value.trim()
        val accName = _accountName.value.trim()
        val amtVal = _amount.value.toDoubleOrNull()

        if (accNum.isBlank()) {
            _accountNumberError.value = "Account Number is required"
            isValid = false
        } else if (accNum.length < 6) {
            _accountNumberError.value = "Enter a valid ASELCO account number (at least 6 digits)"
            isValid = false
        } else {
            _accountNumberError.value = null
        }

        if (accName.isBlank()) {
            _accountNameError.value = "Account Name is required"
            isValid = false
        } else {
            _accountNameError.value = null
        }

        if (amtVal == null || amtVal <= 0) {
            _amountError.value = "Please enter a valid bill amount greater than ₱0"
            isValid = false
        } else if (amtVal < 10) {
            _amountError.value = "Minimum payment amount is ₱10.00"
            isValid = false
        } else {
            _amountError.value = null
        }

        if (!isValid) return

        val billDetails = BillDetails(
            accountNumber = accNum,
            accountName = accName,
            amount = amtVal!!
        )

        createPayMongoCheckoutSession(billDetails, _selectedMethod.value)
    }

    private fun createPayMongoCheckoutSession(billDetails: BillDetails, method: PaymentMethod) {
        _uiState.value = PaymentUiState.CreatingSession(method, billDetails.amount)

        viewModelScope.launch {
            val result = repository.createCheckoutSession(billDetails, method)
            result.onSuccess { checkoutResult ->
                _uiState.value = PaymentUiState.WebViewCheckout(
                    checkoutUrl = checkoutResult.checkoutUrl,
                    sessionId = checkoutResult.sessionId,
                    referenceNumber = checkoutResult.referenceNumber,
                    billDetails = billDetails,
                    paymentMethod = method
                )
            }.onFailure { error ->
                _uiState.value = PaymentUiState.Error(
                    message = error.localizedMessage ?: "Failed to initialize PayMongo payment session"
                )
            }
        }
    }

    fun completePayment(
        billDetails: BillDetails,
        method: PaymentMethod,
        refNumber: String,
        sessionId: String
    ) {
        val total = billDetails.amount + serviceFee
        val txnId = "PAYMONGO-" + UUID.randomUUID().toString().take(8).uppercase()

        val receipt = TransactionReceipt(
            transactionId = txnId,
            referenceNumber = refNumber,
            accountNumber = billDetails.accountNumber,
            accountName = billDetails.accountName,
            billAmount = billDetails.amount,
            serviceFee = serviceFee,
            totalPaid = total,
            paymentMethod = method,
            timestampMs = System.currentTimeMillis(),
            status = "SUCCESSFUL"
        )

        _paymentHistory.value = listOf(receipt) + _paymentHistory.value
        _uiState.value = PaymentUiState.Success(receipt)
    }

    fun onCancelCheckout() {
        _uiState.value = PaymentUiState.Form
    }

    fun resetToForm() {
        _uiState.value = PaymentUiState.Form
    }

    fun viewReceipt(receipt: TransactionReceipt) {
        _uiState.value = PaymentUiState.Success(receipt)
    }
}
