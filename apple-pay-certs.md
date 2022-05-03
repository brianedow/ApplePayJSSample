# Apple Pay Certificates

For encrypting and decrypting Apple Pay transactions

## Create Merchant Identifier

1. Navigate to: https://developer.apple.com/account/resources/identifiers/merchant/add/
   - Description: `Payment Vision`
   - Identifier: `merchant.com.paymentvision.applepay`
2. Click Continue
3. Click Register

## Create Payment Processing Certificate

1. Generate certificate and private key:
   ```
   openssl ecparam -out private.key -name prime256v1 -genkey
   openssl req -new -sha256 -key private.key -nodes -out request.csr -subj "/CN=Payment Vision"
   ```
2. Navigate to [Merchant Identifiers](https://developer.apple.com/account/resources/identifiers/list/merchant)
3. Click on the the `merchant.com.paymentvision.applepay` identifier
4. Under "Apple Pay Payment Processing Certificate" click Create Certificate
5. Click Continue
6. Click Choose File, and select the request.csr generated in Step 1
7. Click Continue
8. Click Download
9. Move the downloaded apple_pay.cer file to the certs folder

## Add Merchant Domain

1. Navigate to [Merchant Identifiers](https://developer.apple.com/account/resources/identifiers/list/merchant)
2. Click on the the `merchant.com.paymentvision.applepay` identifier
3. Under "Merchant Domains" click Add Domain
4. Enter `applepay.paymentvision.com`
5. Click Save
6. Click Download
7. Move the downloaded apple-developer-merchantid-domain-association.txt file to the .well-known folder of the web app hosted at `applepay.paymentvision.com`
8. Click Verify

## Create Merchant Identity Certificate

1. Generate certificate and private key:
   ```
   openssl req -nodes -newkey rsa:2048 -sha256 -keyout certificate.key -out certificate.csr -subj "/CN=Payment Vision"
   ```
2. Navigate to [Merchant Identifiers](https://developer.apple.com/account/resources/identifiers/list/merchant)
3. Click on the the `merchant.com.paymentvision.applepay` identifier
4. Under "Apple Pay Merchant Identity Certificate" click Create Certificate
5. Click Choose File, and select the certificate.csr generated in Step 1
6. Click Continue
7. Click Download
8. Move the downloaded merchant_id.cer file to the certs folder

## Altpay Web App Certificates
Used for encrypting transactions sent to Apple Pay

### Export PFX

1. Open a shell in the certs folder
2. Generate certificate
   ```
   openssl x509 -inform der -in merchant_id.cer -out certificate.pem
   openssl pkcs12 -export -inkey certificate.key -in certificate.pem  -out certificate.pfx
   ```
3. Move PFX to root folder of the web app hosted at `applepay.paymentvision.com`
4. Update the web app's appsettings.json, changing the `ApplePay.MerchantCertificatePassword` value to the password entered in Step 2

## Altpay API Certificates
Used for decrypting transactions returned from Apple Pay

### Export DER

1. Open a shell in the certs folder
2. Generate certificate
   ```
   openssl pkcs8 -topk8 -inform PEM -outform DER -in private.key -out privateKey.der -nocrypt
   ```

### Export P12
1. Open a shell in the certs folder
2. Generate certificate
   ```
   openssl pkcs12 -export -out certificate.p12 -inkey certificate.key -in certificate.pem
   ```
