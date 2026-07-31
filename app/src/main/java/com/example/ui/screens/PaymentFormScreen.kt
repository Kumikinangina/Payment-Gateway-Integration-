package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AccountBox
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Numbers
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.PaymentMethod
import com.example.data.model.TransactionReceipt
import com.example.ui.theme.AselcoPrimary
import com.example.ui.theme.AselcoTertiary
import com.example.ui.theme.CardBorder
import com.example.ui.theme.GCashBlue
import com.example.ui.theme.GCashBlueBg
import com.example.ui.theme.MayaGreen
import com.example.ui.theme.MayaGreenBg
import com.example.ui.viewmodel.PaymentViewModel
import com.example.ui.viewmodel.SavedAccount
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentFormScreen(
    viewModel: PaymentViewModel,
    modifier: Modifier = Modifier
) {
    val accountNumber by viewModel.accountNumber.collectAsState()
    val accountName by viewModel.accountName.collectAsState()
    val amount by viewModel.amount.collectAsState()
    val selectedMethod by viewModel.selectedMethod.collectAsState()

    val accountNumberError by viewModel.accountNumberError.collectAsState()
    val accountNameError by viewModel.accountNameError.collectAsState()
    val amountError by viewModel.amountError.collectAsState()

    val history by viewModel.paymentHistory.collectAsState()

    val doubleAmount = amount.toDoubleOrNull() ?: 0.0
    val totalPayment = doubleAmount + viewModel.serviceFee

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.ElectricBolt,
                            contentDescription = "ASELCO Logo",
                            tint = AselcoTertiary,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "ASELCO Bill Pay",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = Color.White
                            )
                            Text(
                                text = "Agusan del Sur Electric Cooperative",
                                fontSize = 11.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = AselcoPrimary,
                    titleContentColor = Color.White
                )
            )
        },
        modifier = modifier
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Hero Banner
            item {
                HeaderBannerCard()
            }

            // Quick Account Selector
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Text(
                        text = "Quick Fill Saved Accounts",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(viewModel.savedAccounts) { saved ->
                            SavedAccountChip(
                                account = saved,
                                onClick = { viewModel.applySavedAccount(saved) }
                            )
                        }
                    }
                }
            }

            // Form Inputs Section
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text(
                            text = "Account Details",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = AselcoPrimary
                        )

                        // Account Number Field
                        OutlinedTextField(
                            value = accountNumber,
                            onValueChange = { viewModel.onAccountNumberChanged(it) },
                            label = { Text("Account Number") },
                            placeholder = { Text("e.g. 12-3456-7890") },
                            leadingIcon = {
                                Icon(Icons.Default.Numbers, contentDescription = null, tint = AselcoPrimary)
                            },
                            isError = accountNumberError != null,
                            supportingText = accountNumberError?.let { err -> { Text(err, color = MaterialTheme.colorScheme.error) } },
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Number,
                                imeAction = ImeAction.Next
                            ),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AselcoPrimary,
                                focusedLabelColor = AselcoPrimary
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("account_number_input")
                        )

                        // Account Name Field
                        OutlinedTextField(
                            value = accountName,
                            onValueChange = { viewModel.onAccountNameChanged(it) },
                            label = { Text("Account Name") },
                            placeholder = { Text("e.g. Juan Dela Cruz") },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = AselcoPrimary)
                            },
                            isError = accountNameError != null,
                            supportingText = accountNameError?.let { err -> { Text(err, color = MaterialTheme.colorScheme.error) } },
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AselcoPrimary,
                                focusedLabelColor = AselcoPrimary
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("account_name_input")
                        )

                        // Bill Amount Field
                        OutlinedTextField(
                            value = amount,
                            onValueChange = { viewModel.onAmountChanged(it) },
                            label = { Text("Bill Amount (PHP)") },
                            placeholder = { Text("0.00") },
                            prefix = { Text("₱ ", fontWeight = FontWeight.Bold) },
                            leadingIcon = {
                                Icon(Icons.Default.ReceiptLong, contentDescription = null, tint = AselcoPrimary)
                            },
                            isError = amountError != null,
                            supportingText = amountError?.let { err -> { Text(err, color = MaterialTheme.colorScheme.error) } },
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Decimal,
                                imeAction = ImeAction.Done
                            ),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AselcoPrimary,
                                focusedLabelColor = AselcoPrimary
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("bill_amount_input")
                        )
                    }
                }
            }

            // Payment Options Selector
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.AccountBalanceWallet,
                                contentDescription = null,
                                tint = AselcoPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Select PayMongo Payment Option",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = AselcoPrimary
                            )
                        }

                        // GCash Option
                        PaymentMethodOptionCard(
                            method = PaymentMethod.GCASH,
                            isSelected = selectedMethod == PaymentMethod.GCASH,
                            onSelect = { viewModel.onMethodSelected(PaymentMethod.GCASH) },
                            badgeText = "Most Popular",
                            testTag = "gcash_option"
                        )

                        // Maya Option
                        PaymentMethodOptionCard(
                            method = PaymentMethod.MAYA,
                            isSelected = selectedMethod == PaymentMethod.MAYA,
                            onSelect = { viewModel.onMethodSelected(PaymentMethod.MAYA) },
                            badgeText = "Fast Checkout",
                            testTag = "maya_option"
                        )
                    }
                }
            }

            // Summary Breakdown & Pay Button
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = AselcoPrimary.copy(alpha = 0.05f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Payment Summary",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = AselcoPrimary
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("ASELCO Electricity Bill", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(formatPhp(doubleAmount), fontWeight = FontWeight.Medium)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("PayMongo E-Wallet Fee", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(formatPhp(viewModel.serviceFee), fontWeight = FontWeight.Medium)
                        }

                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 4.dp),
                            color = AselcoPrimary.copy(alpha = 0.2f)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Total Amount Due",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color.Black
                            )
                            Text(
                                formatPhp(totalPayment),
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 20.sp,
                                color = AselcoPrimary
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Pay Button
                        Button(
                            onClick = { viewModel.validateAndProceed() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp)
                                .testTag("pay_now_button"),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selectedMethod == PaymentMethod.GCASH) GCashBlue else MayaGreen
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    Icons.Default.Shield,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Pay ${formatPhp(totalPayment)} via ${selectedMethod.displayName}",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Secured by PayMongo Philippines API",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Transaction History Section
            if (history.isNotEmpty()) {
                item {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.History,
                                contentDescription = null,
                                tint = AselcoPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Recent Paid Bills",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = AselcoPrimary
                            )
                        }

                        history.forEach { item ->
                            HistoryItemCard(
                                receipt = item,
                                onClick = { viewModel.viewReceipt(item) }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun HeaderBannerCard() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.img_aselco_banner),
                contentDescription = "ASELCO Banner",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
            )
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Bottom
            ) {
                Surface(
                    color = AselcoTertiary,
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = "OFFICIAL E-PAYMENT PORTAL",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.Black,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Pay Agusan Electric Bill Online",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Instant credit confirmation via GCash & Maya",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }
        }
    }
}

@Composable
private fun SavedAccountChip(
    account: SavedAccount,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = AselcoPrimary.copy(alpha = 0.08f),
        border = androidx.compose.foundation.BorderStroke(1.dp, AselcoPrimary.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.AccountBox,
                contentDescription = null,
                tint = AselcoPrimary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Column {
                Text(
                    text = account.title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = AselcoPrimary
                )
                Text(
                    text = "Acc #${account.accountNumber}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun PaymentMethodOptionCard(
    method: PaymentMethod,
    isSelected: Boolean,
    onSelect: () -> Unit,
    badgeText: String,
    testTag: String
) {
    val brandColor = if (method == PaymentMethod.GCASH) GCashBlue else MayaGreen
    val brandBgColor = if (method == PaymentMethod.GCASH) GCashBlueBg else MayaGreenBg

    Surface(
        onClick = onSelect,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) brandBgColor else Color.White,
        border = androidx.compose.foundation.BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) brandColor else CardBorder
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = isSelected,
                onClick = onSelect,
                colors = RadioButtonDefaults.colors(selectedColor = brandColor)
            )
            Spacer(modifier = Modifier.width(8.dp))

            // Brand Icon Circle
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(brandColor),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (method == PaymentMethod.GCASH) "G" else "M",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 20.sp,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = method.displayName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.Black
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = brandColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = badgeText,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = brandColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    text = method.description,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun HistoryItemCard(
    receipt: TransactionReceipt,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = AselcoPrimary,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Acc #${receipt.accountNumber}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "${receipt.paymentMethod.displayName} • ${receipt.formattedDate()}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = receipt.formattedTotalPaid(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = AselcoPrimary
                )
                Text(
                    text = "View Receipt >",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = GCashBlue
                )
            }
        }
    }
}

private fun formatPhp(valAmount: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("en", "PH"))
    return format.format(valAmount).replace("PHP", "₱")
}
