import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as containerregistry from '@pulumi/azure-native/containerregistry';

// Load Pulumi configuration settings
const config = new pulumi.Config();
const appPath = config.require('appPath');
let prefixName = config.require('prefixName');

// Ensure prefixName contains only valid alphanumeric characters for ACR
prefixName = prefixName.replace(/[^a-zA-Z0-9]/g, '');

const imageName = prefixName;
const imageTag = config.require('imageTag');
const containerPort = config.requireNumber('containerPort');
const publicPort = config.requireNumber('publicPort');
const cpu = config.requireNumber('cpu');
const memory = config.requireNumber('memory');

// Create a new Azure Resource Group
const resourceGroup = new resources.ResourceGroup(`${prefixName}-rg`);

// Create an Azure Container Registry (ACR) with a basic SKU
const registry = new containerregistry.Registry(`${prefixName}ACR`, {
    resourceGroupName: resourceGroup.name,
    adminUserEnabled: true,
    sku: {
        name: containerregistry.SkuName.Basic,
    },
});

// Get the authentication credentials for ACR
const registryCredentials = containerregistry
    .listRegistryCredentialsOutput({
        resourceGroupName: resourceGroup.name,
        registryName: registry.name,
    })
    .apply((creds) => {
        return {
            username: creds.username!,
            password: creds.passwords![0].value!,
        };
    });

// Temporary Outputs to Verify Registry Details (Remove After Verification)
export const acrServer = registry.loginServer;
export const acrUsername = registryCredentials.username;
