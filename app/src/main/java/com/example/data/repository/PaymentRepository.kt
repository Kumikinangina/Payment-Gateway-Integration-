package com.example.data.repository

import android.util.Base64
import android.util.Log
import com.example.BuildConfig
import com.example.data.api.CheckoutSessionAttributes
import com.example.data.api.CheckoutSessionData
import com.example.data.api.CreateCheckoutSessionRequest
import com.example.data.api.LineItem
import com.example.data.api.RetrofitClient
import com.example.data.model.BillDetails
import com.example.data.model.PaymentMethod
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class PaymentRepository {

    private val api = RetrofitClient.payMongoApi

    suspend fun createCheckoutSession(
        billDetails: BillDetails,
        paymentMethod: PaymentMethod
    ): Result<CheckoutResult> = withContext(Dispatchers.IO) {
        val secretKey = getPayMongoSecretKey()
        val refNumber = "ASELCO-" + (100000..999999).random()

        // Amount in centavos (PHP 100.00 = 10000)
        val amountInCentavos = (billDetails.amount * 100).toInt().coerceAtLeast(100)

        // Check if key is empty or default placeholder
        val isPlaceholderKey = secretKey.isBlank() ||
                secretKey.contains("placeholder", ignoreCase = true) ||
                secretKey == "MY_PAYMONGO_KEY"

        if (!isPlaceholderKey) {
            try {
                val basicAuth = "Basic " + Base64.encodeToString(
                    "$secretKey:".toByteArray(),
                    Base64.NO_WRAP
                )

                val request = CreateCheckoutSessionRequest(
                    data = CheckoutSessionData(
                        attributes = CheckoutSessionAttributes(
                            lineItems = listOf(
                                LineItem(
                                    amountInCentavos = amountInCentavos,
                                    currency = "PHP",
                                    description = "ASELCO Electric Bill Payment for Account #${billDetails.accountNumber}",
                                    name = "ASELCO Bill - ${billDetails.accountName}",
                                    quantity = 1
                                )
                            ),
                            paymentMethodTypes = listOf(paymentMethod.apiType),
                            description = "ASELCO Electric Bill Payment",
                            referenceNumber = refNumber,
                            successUrl = "https://aselco.ph/payment/success?ref=$refNumber",
                            cancelUrl = "https://aselco.ph/payment/cancel?ref=$refNumber"
                        )
                    )
                )

                val response = api.createCheckoutSession(basicAuth, request)
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    val url = body.data.attributes.checkoutUrl
                    val sessionId = body.data.id
                    Log.d("PaymentRepository", "PayMongo session created: $sessionId, URL: $url")
                    return@withContext Result.success(
                        CheckoutResult(
                            checkoutUrl = url,
                            sessionId = sessionId,
                            referenceNumber = refNumber,
                            isSimulated = false
                        )
                    )
                } else {
                    Log.e("PaymentRepository", "PayMongo API Error: ${response.code()} ${response.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                Log.e("PaymentRepository", "PayMongo Network Call Exception: ${e.message}", e)
            }
        }

        // Fallback for placeholder API key or network error in prototype environment:
        // Generates a test interactive Checkout URL that simulates PayMongo's portal!
        val simulatedSessionId = "cs_test_" + UUID.randomUUID().toString().take(12)
        val simulatedCheckoutUrl = "https://aselco.ph/paymongo/checkout?session=$simulatedSessionId&method=${paymentMethod.apiType}&amount=${billDetails.amount}&account=${billDetails.accountNumber}&name=${billDetails.accountName}&ref=$refNumber"

        Log.i("PaymentRepository", "Using simulated PayMongo checkout URL for prototype preview")
        Result.success(
            CheckoutResult(
                checkoutUrl = simulatedCheckoutUrl,
                sessionId = simulatedSessionId,
                referenceNumber = refNumber,
                isSimulated = true
            )
        )
    }

    private fun getPayMongoSecretKey(): String {
        return try {
            BuildConfig.PAYMONGO_SECRET_KEY
        } catch (e: Exception) {
            "sk_test_placeholder"
        }
    }
}

data class CheckoutResult(
    val checkoutUrl: String,
    val sessionId: String,
    val referenceNumber: String,
    val isSimulated: Boolean
)
