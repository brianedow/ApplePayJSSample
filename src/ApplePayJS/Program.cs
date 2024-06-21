// Copyright (c) PaymentVision, 2021. All rights reserved.
// Licensed under the Apache 2.0 license. See the LICENSE file in the project root for full license information.

namespace JustEat.ApplePayJS
{
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.Extensions.Hosting;

    public static class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        //public static IHostBuilder CreateHostBuilder(string[] args) =>
        //    Host.CreateDefaultBuilder(args)
        //        .ConfigureWebHostDefaults((builder) => builder.UseStartup<Startup>());

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();

                    if (args.Length == 1)
                    {
                        webBuilder.UseUrls(string.Format("http://{0}:5000", args[0]), string.Format("https://{0}:5001", args[0]));
                    }
                    else
                    {
                        webBuilder.UseUrls("http://localhost:5000", "https://localhost:5001");
                    }


                });

    }
}
