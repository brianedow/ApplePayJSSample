// Copyright (c) PaymentVision, 2021. All rights reserved.
// Licensed under the Apache 2.0 license. See the LICENSE file in the project root for full license information.

const paymentVisionUri = {
  applePay: "TODO",
  googlePay: "https://pvapi.paymentvision.com/rest/MakeCardPaymentViaGooglePay",
};

paymentVision = {
  applePay: {
    // Function to handle payment when the Apple Pay button is clicked/pressed.
    beginPayment: async function (e) {
      e.preventDefault();

      // Get the amount to request from the form and set up
      // the totals and line items for collection and delivery.
      var subtotal = $("#amount").val();
      var delivery = "0.00";
      var deliveryTotal = (Number(subtotal) + Number(delivery)).toString();

      var countryCode = $("meta[name='payment-country-code']").attr("content") || "GB";
      var currencyCode = $("meta[name='payment-currency-code']").attr("content") || "GBP";
      var storeName = $("meta[name='apple-pay-store-name']").attr("content");

      var totalForCollection = {
        label: storeName,
        amount: subtotal,
      };

      var lineItemsForCollection = [{ label: "Subtotal", amount: subtotal, type: "final" }];

      var totalForDelivery = {
        label: storeName,
        amount: deliveryTotal,
      };

      var lineItemsForDelivery = [
        { label: "Subtotal", amount: subtotal, type: "final" },
        { label: "Delivery", amount: delivery, type: "final" },
      ];

      // Create the Apple Pay payment request as appropriate.
      var paymentRequest = {
        applicationData: btoa("Custom application-specific data"),
        countryCode: countryCode,
        currencyCode: currencyCode,
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["amex", "masterCard", "visa"],
        lineItems: lineItemsForDelivery,
        total: totalForDelivery,
        requiredBillingContactFields: ["email", "name", "phone", "postalAddress"],
        requiredShippingContactFields: ["email", "name", "phone", "postalAddress"],
        shippingType: "delivery",
        shippingMethods: [
          { label: "Delivery", amount: delivery, identifier: "delivery", detail: "Delivery to you" },
          { label: "Collection", amount: "0.00", identifier: "collection", detail: "Collect from the store" },
        ],
        supportedCountries: [countryCode],
      };

      /*paymentRequest = {
                "countryCode": "GB",
                "currencyCode": "GBP",
                "merchantCapabilities": [
                    "supports3DS"
                ],
                "supportedNetworks": [
                    "visa",
                    "masterCard",
                    "amex",
                    "discover"
                ],
                "total": {
                    "label": "Demo (Card is not charged)",
                    "type": "final",
                    "amount": "1.99"
                }
            }*/

      // You can optionally pre-populate the billing and shipping contact
      // with information about the current user, if available to you.
      // paymentRequest.billingContact = {
      //     givenName: "",
      //     familyName: ""
      // };
      // paymentRequest.shippingContact = {
      //     givenName: "",
      //     familyName: ""
      // };

      // Create the Apple Pay session.
      var versionsSupported = [
        ApplePaySession.supportsVersion(1),
        ApplePaySession.supportsVersion(2),
        ApplePaySession.supportsVersion(3),
        ApplePaySession.supportsVersion(4),
        ApplePaySession.supportsVersion(5),
        ApplePaySession.supportsVersion(6),
        ApplePaySession.supportsVersion(7),
        ApplePaySession.supportsVersion(8),
        ApplePaySession.supportsVersion(9),
        ApplePaySession.supportsVersion(10),
        ApplePaySession.supportsVersion(11),
        ApplePaySession.supportsVersion(12),
      ];
      var session = new ApplePaySession(8, paymentRequest);

      /*session.onvalidatemerchant = event => {
                // Call your own server to request a new merchant session.
                fetch("/authorizeMerchant")
                    .then(res => res.json()) // Parse response as JSON.
                    .then(merchantSession => {
                        session.completeMerchantValidation(merchantSession);
                    })
                    .catch(err => {
                        console.error("Error fetching merchant session", err);
                    });
            };*/

      // Setup handler for validation the merchant session.
      session.onvalidatemerchant = function (event) {
        // Create the payload.
        var data = {
          validationUrl: event.validationURL,
        };

        // Setup antiforgery HTTP header.
        var antiforgeryHeader = $("meta[name='x-antiforgery-name']").attr("content");
        var antiforgeryToken = $("meta[name='x-antiforgery-token']").attr("content");

        var headers = {};
        headers[antiforgeryHeader] = antiforgeryToken;

        // Post the payload to the server to validate the
        // merchant session using the merchant certificate.
        var merchantValidationUrl = $("link[rel='merchant-validation']").attr("href");
        $.ajax({
          url: merchantValidationUrl,
          method: "POST",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data),
          headers: headers,
        })
          .then(function (merchantSession) {
            // Complete validation by passing the merchant session to the Apple Pay session.
            console.log(merchantSession);
            session.completeMerchantValidation(merchantSession);
          })
          .catch((err) => {
            console.error("Error calling merchant validation: ", err.responseText);
          });
      };

      // Setup handler for shipping method selection.
      session.onshippingmethodselected = function (event) {
        var newTotal;
        var newLineItems;

        if (event.shippingMethod.identifier === "collection") {
          newTotal = totalForCollection;
          newLineItems = lineItemsForCollection;
        } else {
          newTotal = totalForDelivery;
          newLineItems = lineItemsForDelivery;
        }

        var update = {
          newTotal: newTotal,
          newLineItems: newLineItems,
        };

        session.completeShippingMethodSelection(update);
      };

      // Setup handler to receive the token when payment is authorized.
      session.onpaymentauthorized = function (event) {
        const payload = getApplePayPayload(event.payment.token.paymentData);
        console.log("Payload: ", payload);

        fetch(paymentVisionUri.applePay, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: payload,
        })
          .then(() => {
            session.completePayment({
              status: ApplePaySession.STATUS_SUCCESS,
              errors: [],
            });

            paymentVision.applePay.showSuccess();
          })
          .catch((err) => {
            console.error("Unable to post payload to PaymentVision API", err);
            throw err;
          });
      };

      session.oncancel = function (event) {
        var x = 1;
        console.log("oncancel(" + JSON.stringify(event) + ")");
      };

      // Start the session to display the Apple Pay sheet.
      session.begin();
      /*
            // Consider falling back to Apple Pay JS if Payment Request is not available.
            if (!window.PaymentRequest)
                return;

            try {
                const applePayMethod = {
                    supportedMethods: "https://apple.com/apple-pay",
                    data: {
                        version: 3,
                        merchantIdentifier: "merchant.com.example",
                        merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
                        supportedNetworks: ["amex", "discover", "masterCard", "visa"],
                        countryCode: "US",
                    },
                };
                const paymentDetails = {
                    total: {
                        label: "My Merchant",
                        amount: { value: "27.50", currency: "USD" },
                    },
                    displayItems: [{
                        label: "Tax",
                        amount: { value: "2.50", currency: "USD" },
                    }, {
                        label: "Ground Shipping",
                        amount: { value: "5.00", currency: "USD" },
                    }],
                    shippingOptions: [{
                        id: "ground",
                        label: "Ground Shipping",
                        amount: { value: "5.00", currency: "USD" },
                        selected: true,
                    }, {
                        id: "express",
                        label: "Express Shipping",
                        amount: { value: "10.00", currency: "USD" },
                    }],
                };
                const paymentOptions = {
                    requestPayerName: true,
                    requestPayerEmail: true,
                    requestPayerPhone: true,
                    requestShipping: true,
                    shippingType: "shipping",
                };
                const request = new PaymentRequest([applePayMethod], paymentDetails, paymentOptions);

                request.onmerchantvalidation = function (event) {
                    // Have your server fetch a payment session from event.validationURL.
                    const sessionPromise = fetchPaymentSession(event.validationURL);
                    event.complete(sessionPromise);
                };

                request.onshippingoptionchange = function (event) {
                    // Compute new payment details based on the selected shipping option.
                    const detailsUpdatePromise = computeDetails();
                    event.updateWith(detailsUpdatePromise);
                };

                request.onshippingaddresschange = function (event) {
                    // Compute new payment details based on the selected shipping address.
                    const detailsUpdatePromise = computeDetails();
                    event.updateWith(detailsUpdatePromise);
                };

                const response = //await request.show()
                    request.show()
                    .then((paymentResponse) => {
                      // The user filled in the required fields and completed the flow
                      // Get the details from `paymentResponse` and complete the transaction.
                      return paymentResponse.complete();
                    })
                    .catch((err) => {
                        // The API threw an error or the user closed the UI
                        var y = 1;
                    });
                //const status = processResponse(response);
                //response.complete(status);
            } catch (e) {
                // Handle errors
                var x = 1;
            }

*/
    },
    setupApplePay: function () {
      var merchantIdentifier = paymentVision.applePay.getMerchantIdentifier();
      ApplePaySession.openPaymentSetup(merchantIdentifier)
        .then(function (success) {
          if (success) {
            paymentVision.applePay.hideSetupButton();
            paymentVision.applePay.showButton();
          } else {
            paymentVision.applePay.showError("Failed to set up Apple Pay.");
          }
        })
        .catch(function (e) {
          paymentVision.applePay.showError("Failed to set up Apple Pay. " + e);
        });
    },
    showButton: function () {
      var button = $("#apple-pay-button");
      button.attr("lang", paymentVision.applePay.getPageLanguage());
      button.on("click", paymentVision.applePay.beginPayment);

      if (paymentVision.applePay.supportsSetup()) {
        button.addClass("apple-pay-button-with-text");
        button.addClass("apple-pay-button-black-with-text");
      } else {
        button.addClass("apple-pay-button");
        button.addClass("apple-pay-button-black");
      }

      button.removeClass("d-none");
    },
    showSetupButton: function () {
      var button = $("#set-up-apple-pay-button");
      button.attr("lang", paymentVision.applePay.getPageLanguage());
      button.on("click", $.proxy(paymentVision.applePay, "setupApplePay"));
      button.removeClass("d-none");
    },
    hideSetupButton: function () {
      var button = $("#set-up-apple-pay-button");
      button.addClass("d-none");
      button.off("click");
    },
    showError: function (text) {
      var error = $(".apple-pay-error");
      error.text(text);
      error.removeClass("d-none");
    },
    showSuccess: function () {
      $(".apple-pay-intro").hide();
      var success = $(".apple-pay-success");
      success.removeClass("d-none");
    },
    supportedByDevice: function () {
      return "ApplePaySession" in window;
    },
    supportsSetup: function () {
      return "openPaymentSetup" in ApplePaySession;
    },
    getPageLanguage: function () {
      return $("html").attr("lang") || "en";
    },
    getMerchantIdentifier: function () {
      return $("meta[name='apple-pay-merchant-id']").attr("content");
    },
  },

  googlePay: {
    //let googlePayClient;
    onGooglePayLoaded: function () {
      googlePayClient = new google.payments.api.PaymentsClient({
        environment: "TEST",
      });

      const baseCardPaymentMethod = {
        type: "CARD",
        parameters: {
          allowedCardNetworks: ["VISA", "MASTERCARD"],
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        },
      };

      const googlePayBaseConfiguration = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [baseCardPaymentMethod],
      };

      googlePayClient
        .isReadyToPay(googlePayBaseConfiguration)
        .then(function (response) {
          if (response.result) {
            createAndAddButton();
          } else {
            alert("Unable to pay using Google Pay");
          }
        })
        .catch(function (err) {
          console.error("Error determining readiness to use Google Pay: ", err);
        });

      function createAndAddButton() {
        const googlePayButton = googlePayClient.createButton({
          // currently defaults to black if default or omitted
          buttonColor: "default",

          // defaults to long if omitted
          buttonType: "long",

          onClick: onGooglePaymentsButtonClicked,
        });

        document.getElementById("google-pay-button").appendChild(googlePayButton);
      }

      function onGooglePaymentsButtonClicked() {
        const tokenizationSpecification = {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "paymentvision",
            gatewayMerchantId: "gatewayMerchantId",
          },
        };

        const cardPaymentMethod = {
          type: "CARD",
          tokenizationSpecification: tokenizationSpecification,
          parameters: {
            allowedCardNetworks: ["VISA", "MASTERCARD"],
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            billingAddressRequired: true,
            billingAddressParameters: {
              format: "FULL",
              phoneNumberRequired: true,
            },
          },
        };

        const transactionInfo = {
          totalPriceStatus: "FINAL",
          totalPrice: "123.45",
          currencyCode: "USD",
        };

        const merchantInfo = {
          // merchantId: '01234567890123456789', Only in PRODUCTION
          merchantName: "Example Merchant Name",
        };

        const paymentDataRequest = Object.assign({}, googlePayBaseConfiguration, {
          allowedPaymentMethods: [cardPaymentMethod],
          transactionInfo: transactionInfo,
          merchantInfo: merchantInfo,
        });

        googlePayClient
          .loadPaymentData(paymentDataRequest)
          .then((paymentData) => processPayment(paymentData))
          .catch((err) => {
            console.error("Unable to process payment", err);
            throw err;
          });
      }

      function processPayment(paymentData) {
        const payload = getGooglePayPayload(paymentData.paymentMethodData.tokenizationData.token);

        return fetch(paymentVisionUri.googlePay, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: payload,
        });
      }
    },
  },
};

const getGooglePayPayload = (token) => {
  const payload = {
    googlePayCardPayload: JSON.parse(token),
    cardPayment: {
      merchantPayeeCode: "PAY01",
      amount: "1.00",
      comment: "Payment via altpay.paymentvision.com",
      confirmationNumber: "",
      convenienceFee: "0.00",
      settlementDate: "03/07/2022",
      userDefinedOne: "",
      userDefinedTwo: "",
      externalRequestID: "",
      fulfillmentGateway: "",
      holdForApproval: false,
      isRecurring: false,
    },
    customer: {
      customerReferenceCode: "TestGoogleID",
      accountReferenceCode: "",
      firstName: "Google",
      lastName: "Test",
      adressLineOne: "13 Main St.",
      addressLineTwo: "",
      city: "Alexandria",
      state: "VA",
      zip: "22310",
      homePhone: "215-555-4568",
      workPhone: "215-555-4568",
      email: "bdowney@autoscribe.com",
    },
    merchantOrgization: {
      merchantPrimaryCode: "",
      externalRequestID: "",
    },
  };

  return JSON.stringify(payload);
};

const getApplePayPayload = (token) => {
  const payload = {
    applePayCardPayload: token,
    cardPayment: {
      merchantPayeeCode: "PAY01",
      amount: "1.00",
      comment: "Payment via altpay.paymentvision.com",
      confirmationNumber: "",
      convenienceFee: "0.00",
      settlementDate: "03/07/2022",
      userDefinedOne: "",
      userDefinedTwo: "",
      externalRequestID: "",
      fulfillmentGateway: "",
      holdForApproval: false,
      isRecurring: false,
    },
    customer: {
      customerReferenceCode: "TestGoogleID",
      accountReferenceCode: "",
      firstName: "Google",
      lastName: "Test",
      adressLineOne: "13 Main St.",
      addressLineTwo: "",
      city: "Alexandria",
      state: "VA",
      zip: "22310",
      homePhone: "215-555-4568",
      workPhone: "215-555-4568",
      email: "bdowney@autoscribe.com",
    },
    merchantOrgization: {
      merchantPrimaryCode: "",
      externalRequestID: "",
    },
  };

  return JSON.stringify(payload);
};

(function () {
  // Get the merchant identifier from the page meta tags.
  var merchantIdentifier = paymentVision.applePay.getMerchantIdentifier();

  if (!merchantIdentifier) {
    paymentVision.applePay.showError("No Apple Pay merchant certificate is configured.");
  }
  // Is ApplePaySession available in the browser?
  else if (paymentVision.applePay.supportedByDevice()) {
    // Determine whether to display the Apple Pay button. See this link for details
    // on the two different approaches: https://developer.apple.com/documentation/applepayjs/checking_if_apple_pay_is_available
    if (ApplePaySession.canMakePayments() === true) {
      paymentVision.applePay.showButton();
    } else {
      ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier).then(function (canMakePayments) {
        if (canMakePayments === true) {
          paymentVision.applePay.showButton();
        } else {
          if (paymentVision.applePay.supportsSetup()) {
            paymentVision.applePay.showSetupButton(merchantIdentifier);
          } else {
            paymentVision.applePay.showError(
              "Apple Pay cannot be used at this time. If using macOS you need to be paired with a device that supports at least TouchID."
            );
          }
        }
      });
    }
  } else {
    paymentVision.applePay.showError("This device and/or browser does not support Apple Pay.");
  }

  let googlePayClient;
})();
