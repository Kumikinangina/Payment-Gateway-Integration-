package com.example.data.model

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class PaymentMethod(
    val apiType: String,
    val displayName: String,
    val description: String,
    val brandColorHex: Long
) {
    GCASH("gcash", "GCash", "Fast & secure e-Wallet payment via PayMongo", 0xFF005CE6),
    MAYA("paymaya", "Maya", "Digital bank & e-Wallet payment via PayMongo", 0xFF00A300)
}

data class BillDetails(
    val accountNumber: String,
    val accountName: String,
    val amount: Double,
    val billingPeriod: String = "Current Month",
    val meterNumber: String = "MTR-8849201"
) {
    fun formattedAmount(): String {
        val format = NumberFormat.getCurrencyInstance(Locale("en", "PH"))
        return format.format(amount).replace("PHP", "₱")
    }
}

data class TransactionReceipt(
    val transactionId: String,
    val referenceNumber: String,
    val accountNumber: String,
    val accountName: String,
    val billAmount: Double,
    val serviceFee: Double,
    val totalPaid: Double,
    val paymentMethod: PaymentMethod,
    val timestampMs: Long = System.currentTimeMillis(),
    val status: String = "SUCCESSFUL"
) {
    fun formattedBillAmount(): String = formatPhp(billAmount)
    fun formattedServiceFee(): String = formatPhp(serviceFee)
    fun formattedTotalPaid(): String = formatPhp(totalPaid)

    fun formattedDate(): String {
        val sdf = SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault())
        return sdf.format(Date(timestampMs))
    }

    private fun formatPhp(valAmount: Double): String {
        val format = NumberFormat.getCurrencyInstance(Locale("en", "PH"))
        return format.format(valAmount).replace("PHP", "₱")
    }
}

sealed class PaymentUiState {
    object Form : PaymentUiState()
    data class CreatingSession(val method: PaymentMethod, val amount: Double) : PaymentUiState()
    data class WebViewCheckout(
        val checkoutUrl: String,
        val sessionId: String,
        val referenceNumber: String,
        val billDetails: BillDetails,
        val paymentMethod: PaymentMethod
    ) : PaymentUiState()
    data class Success(val receipt: TransactionReceipt) : PaymentUiState()
    data class Error(val message: String, val canRetry: Boolean = true) : PaymentUiState()
}
