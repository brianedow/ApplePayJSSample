// Copyright (c) PaymentVision, 2021. All rights reserved.
// Licensed under the Apache 2.0 license. See the LICENSE file in the project root for full license information.

using System;
using System.Net.Http;
//using System.Net.Mime;
//using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace JustEat.ApplePayJS.Clients
{
    public class ApplePayClient
    {
        private readonly HttpClient _httpClient;

        public ApplePayClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> XXX (Uri requestUri,
            MerchantSessionRequest request,
            CancellationToken cancellationToken = default)
        {
            // POST the data to create a valid Apple Pay merchant session.
            string result = null;
            try
            {
                string json = JsonSerializer.Serialize(request);

                using var content = new StringContent(json, System.Text.Encoding.UTF8, System.Net.Mime.MediaTypeNames.Application.Json);

                //return "{ RootElement: 'howdy', client='" + ((_httpClient == null) ? "null" : "non-null") + "' }";
                using var response = await _httpClient.PostAsync(requestUri, content, cancellationToken);

                response.EnsureSuccessStatusCode();

                // Read the opaque merchant session JSON from the response body.
                result = await response.Content.ReadAsStringAsync();
            } catch (System.Exception exception) {
                result = exception.ToString();
            }
            return result;
        }

        public async Task<JsonDocument> GetMerchantSessionAsync(
            Uri requestUri,
            MerchantSessionRequest request) //,
            //CancellationToken cancellationToken = default)
        {
            // POST the data to create a valid Apple Pay merchant session.
            return JsonDocument.Parse("{ RootElement: 'howdy' }");
/*
            string json = JsonSerializer.Serialize(request);

            using var content = new StringContent(json, Encoding.UTF8, MediaTypeNames.Application.Json);

            using var response = await _httpClient.PostAsync(requestUri, content, cancellationToken);

            response.EnsureSuccessStatusCode();

            // Read the opaque merchant session JSON from the response body.
            using var stream = await response.Content.ReadAsStreamAsync();

            return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
*/
        }
    }
}
