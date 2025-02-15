using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Altinn.Studio.Designer.Configuration;
using Altinn.Studio.Designer.Controllers;
using Altinn.Studio.Designer.Services.Interfaces;
using Designer.Tests.Mocks;
using Designer.Tests.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace Designer.Tests.Controllers
{
    public class LanguagesControllerTests : IClassFixture<WebApplicationFactory<LanguagesController>>
    {
        private readonly WebApplicationFactory<LanguagesController> _factory;
        private readonly string _versionPrefix = "designer/api/v1";

        public LanguagesControllerTests(WebApplicationFactory<LanguagesController> factory)
        {
            _factory = factory;
            TestSetupUtils.SetupDirtyHackIfLinux();
        }

        [Fact]
        public async Task GetLanguages_ReturnsNnAndNb()
        {
            HttpClient client = GetTestClient();
            string dataPathWithData = $"{_versionPrefix}/ttd/new-texts-format/languages";
            HttpRequestMessage httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, dataPathWithData);
            await AuthenticationUtil.AddAuthenticateAndAuthAndXsrFCookieToRequest(client, httpRequestMessage);

            HttpResponseMessage response = await client.SendAsync(httpRequestMessage);
            response.EnsureSuccessStatusCode();
            string responseBody = await response.Content.ReadAsStringAsync();
            JsonDocument responseDocument = JsonDocument.Parse(responseBody);
            List<string> responseList = JsonSerializer.Deserialize<List<string>>(responseDocument.RootElement.ToString());

            Assert.Equal(StatusCodes.Status200OK, (int)response.StatusCode);
            Assert.Equal(new List<string> { "nb", "nn" }, responseList);
        }

        private HttpClient GetTestClient()
        {
            string unitTestFolder = Path.GetDirectoryName(new Uri(typeof(DatamodelsControllerTests).Assembly.Location).LocalPath);
            string projectDir = Directory.GetCurrentDirectory();
            string configPath = Path.Combine(projectDir, "appsettings.json");

            HttpClient client = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((context, conf) =>
                {
                    conf.AddJsonFile(configPath);
                });

                var configuration = new ConfigurationBuilder()
                    .AddJsonFile(configPath)
                    .Build();

                configuration.GetSection("ServiceRepositorySettings:RepositoryLocation").Value = Path.Combine(unitTestFolder, "..", "..", "..", "_TestData", "Repositories");

                IConfigurationSection serviceRepositorySettingSection = configuration.GetSection("ServiceRepositorySettings");

                Mock<IRepository> repositoryMock = new Mock<IRepository>() { CallBase = true, };
                repositoryMock
                    .Setup(r => r.UpdateApplicationWithAppLogicModel(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                    .Verifiable();

                repositoryMock.
                    Setup(r => r.ReadData(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).
                    Returns<string, string, string>(async (org, repo, path) =>
                    {
                        string repopath = Path.Combine(unitTestFolder, "..", "..", "..", "_TestData", "Repositories", "testUser", org, repo, path);

                        Stream fs = File.OpenRead(repopath);
                        return await Task.FromResult(fs);
                    });
                repositoryMock.Setup(r => r.DeleteData(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Verifiable();
                repositoryMock.Setup(r => r.WriteData(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>())).Verifiable();
                repositoryMock.Setup(r => r.DeleteMetadataForAttachment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns(true);
                builder.ConfigureTestServices(services =>
                {
                    services.Configure<ServiceRepositorySettings>(serviceRepositorySettingSection);
                    services.AddSingleton<IGitea, IGiteaMock>();

                    services.AddSingleton(repositoryMock.Object);
                });
            }).CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
            return client;
        }
    }
}
