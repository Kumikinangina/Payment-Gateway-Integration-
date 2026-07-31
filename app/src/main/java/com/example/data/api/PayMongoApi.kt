package com.example.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface PayMongoApi {

    @POST("v1/checkout_sessions")
    suspend fun createCheckoutSession(
        @Header("Authorization") authHeader: String,
        @Body request: CreateCheckoutSessionRequest
    ): Response<CheckoutSessionResponse>

}
