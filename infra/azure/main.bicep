@description('Região dos recursos.')
param location string = resourceGroup().location

@description('Prefixo curto. O template acrescenta um sufixo único.')
@minLength(3)
@maxLength(12)
param namePrefix string = 'glpoc'

@description('Login administrador do Azure SQL. Senha vai só para o Key Vault.')
param sqlAdminLogin string

@secure()
param sqlAdminPassword string

@secure()
param jwtSigningKey string

@description('Object id do principal que executa o deploy (app registration do GitHub OIDC).')
param deployerPrincipalId string

var suffix = take(uniqueString(resourceGroup().id), 6)
var prefix = '${namePrefix}${suffix}'
var storageName = toLower(replace('${prefix}st', '-', ''))
var vaultName = '${prefix}-kv'

resource sql 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: '${prefix}-sql'
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource firewall 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sql
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sql
  name: 'GlDemandas'
  location: location
  sku: { name: 'Basic', tier: 'Basic' }
  properties: { collation: 'SQL_Latin1_General_CP1_CI_AS' }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource anexos 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'anexos'
  properties: { publicAccess: 'None' }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${prefix}-plan'
  location: location
  sku: { name: 'B1', tier: 'Basic' }
  kind: 'linux'
  properties: { reserved: true }
}

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: '${prefix}-api'
  location: location
  identity: { type: 'SystemAssigned' }
  dependsOn: [secretSql, secretJwt, secretBlob]
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      appSettings: [
        { name: 'Database__Provider', value: 'SqlServer' }
        { name: 'ConnectionStrings__Sql', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=sql-connection)' }
        { name: 'Auth__Mode', value: 'Demo' }
        { name: 'Auth__SigningKey', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=jwt-signing-key)' }
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'Anexo__Provider', value: 'Blob' }
        { name: 'Anexo__ConnectionString', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=blob-connection)' }
        { name: 'Anexo__Container', value: 'anexos' }
        { name: 'Cors__Origins__0', value: 'https://${portal.properties.defaultHostname}' }
      ]
    }
  }
}

resource portal 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${prefix}-web'
  location: location
  sku: { name: 'Free', tier: 'Free' }
  properties: { allowConfigFileUpdates: true }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: deployerPrincipalId
        permissions: { secrets: ['get', 'list', 'set'] }
      }
    ]
  }
}

resource apiPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: vault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: api.identity.principalId
        permissions: { secrets: ['get', 'list'] }
      }
    ]
  }
}

var sqlConnection = 'Server=tcp:${sql.properties.fullyQualifiedDomainName},1433;Initial Catalog=${database.name};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

resource secretSql 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'sql-connection'
  properties: { value: sqlConnection }
}

resource secretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'jwt-signing-key'
  properties: { value: jwtSigningKey }
}

resource secretBlob 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'blob-connection'
  properties: { value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
}

output apiName string = api.name
output apiHost string = api.properties.defaultHostName
output portalName string = portal.name
output vaultName string = vault.name
output sqlServer string = sql.properties.fullyQualifiedDomainName
output storageAccount string = storage.name
output firewallRule string = firewall.name
