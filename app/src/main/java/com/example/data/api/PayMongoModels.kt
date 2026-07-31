package com.example.data.api

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * PayMongo Checkout Session Request Models
 * Endpoint: POST https://api.paymongo.com/v1/checkout_sessions
 */
@JsonClass(generateAdapter = true)
data class CreateCheckoutSessionRequest(
    @Json(name = "data") val data: CheckoutSessionData
)

@JsonClass(generateAdapter = true)
data class CheckoutSessionData(
    @Json(name = "attributes") val attributes: CheckoutSessionAttributes
)

@JsonClass(generateAdapter = true)
data class CheckoutSessionAttributes(
    @Json(name = "line_items") val lineItems: List<LineItem>,
    @Json(name = "payment_method_types") val paymentMethodTypes: List<String>,
    @Json(name = "description") val description: String,
    @Json(name = "send_email_receipt") val sendEmailReceipt: Boolean = true,
    @Json(name = "show_description") val showDescription: Boolean = true,
    @Json(name = "show_line_items") val showLineItems: Boolean = true,
    @Json(name = "success_url") val successUrl: String = "https://aselco.ph/payment/success",
    @Json(name = "cancel_url") val cancelUrl: String = "https://aselco.ph/payment/cancel",
    @Json(name = "reference_number") val referenceNumber: String? = null
)

@JsonClass(generateAdapter = true)
data class LineItem(
    @Json(name = "amount") val amountInCentavos: Int, // e.g. PHP 500.00 = 50000
    @Json(name = "currency") val currency: String = "PHP",
    @Json(name = "description") val description: String,
    @Json(name = "name") val name: String,
    @Json(name = "quantity") val quantity: Int = 1
)

/**
 * PayMongo Checkout Session Response Models
 */
@JsonClass(generateAdapter = true)
data class CheckoutSessionResponse(
    @Json(name = "data") val data: CheckoutResponseData
)

@JsonClass(generateAdapter = true)
data class CheckoutResponseData(
    @Json(name = "id") val id: String,
    @Json(name = "type") val type: String? = "checkout_session",
    @Json(name = "attributes") val attributes: CheckoutResponseAttributes
)

@JsonClass(generateAdapter = true)
data class CheckoutResponseAttributes(
    @Json(name = "checkout_url") val checkoutUrl: String,
    @Json(name = "status") val status: String? = "active",
    @Json(name = "payment_intent") val paymentIntent: PaymentIntentData? = null,
    @Json(name = "reference_number") val referenceNumber: String? = null
)

@JsonClass(generateAdapter = true)
data class PaymentIntentData(
    @Json(name = "id") val id: String? = null
)
