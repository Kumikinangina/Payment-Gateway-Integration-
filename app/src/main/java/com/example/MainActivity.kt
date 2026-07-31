package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.PaymentUiState
import com.example.ui.screens.PaymentFormScreen
import com.example.ui.screens.ReceiptScreen
import com.example.ui.screens.WebViewPaymentScreen
import com.example.ui.theme.AselcoPrimary
import com.example.ui.theme.AselcoTheme
import com.example.ui.viewmodel.PaymentViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AselcoTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AselcoAppContent()
                }
            }
        }
    }
}

@Composable
fun AselcoAppContent(
    paymentViewModel: PaymentViewModel = viewModel()
) {
    val uiState by paymentViewModel.uiState.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        when (val state = uiState) {
            is PaymentUiState.Form -> {
                PaymentFormScreen(viewModel = paymentViewModel)
            }
            is PaymentUiState.CreatingSession -> {
                PaymentFormScreen(viewModel = paymentViewModel)
                LoadingSessionOverlay(
                    methodName = state.method.displayName,
                    amount = state.amount
                )
            }
            is PaymentUiState.WebViewCheckout -> {
                WebViewPaymentScreen(
                    checkoutUrl = state.checkoutUrl,
                    sessionId = state.sessionId,
                    referenceNumber = state.referenceNumber,
                    billDetails = state.billDetails,
                    paymentMethod = state.paymentMethod,
                    onPaymentSuccess = {
                        paymentViewModel.completePayment(
                            billDetails = state.billDetails,
                            method = state.paymentMethod,
                            refNumber = state.referenceNumber,
                            sessionId = state.sessionId
                        )
                    },
                    onCancel = {
                        paymentViewModel.onCancelCheckout()
                    }
                )
            }
            is PaymentUiState.Success -> {
                ReceiptScreen(
                    receipt = state.receipt,
                    onDone = {
                        paymentViewModel.resetToForm()
                    }
                )
            }
            is PaymentUiState.Error -> {
                PaymentFormScreen(viewModel = paymentViewModel)
                AlertDialog(
                    onDismissRequest = { paymentViewModel.resetToForm() },
                    icon = {
                        Icon(
                            Icons.Default.Error,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(36.dp)
                        )
                    },
                    title = {
                        Text(
                            text = "PayMongo Connection",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    text = {
                        Text(text = state.message)
                    },
                    confirmButton = {
                        Button(
                            onClick = { paymentViewModel.resetToForm() },
                            colors = ButtonDefaults.buttonColors(containerColor = AselcoPrimary)
                        ) {
                            Text("Back to Form")
                        }
                    },
                    shape = RoundedCornerShape(16.dp)
                )
            }
        }
    }
}

@Composable
fun LoadingSessionOverlay(methodName: String, amount: Double) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.6f))
            .testTag("loading_overlay"),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color.White,
            modifier = Modifier
                .padding(24.dp)
                .fillMaxWidth(0.85f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(
                    color = AselcoPrimary,
                    strokeWidth = 3.dp,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Creating PayMongo Session...",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = AselcoPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Preparing $methodName checkout redirect",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
