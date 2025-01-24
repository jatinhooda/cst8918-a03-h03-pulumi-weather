import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as containerregistry from '@pulumi/azure-native/containerregistry';
import * as docker from '@pulumi/docker';

// Load Pulumi configuration settings
const config = new pulumi.Config();
const appPath = config.require('appPath'); // Path to the app (Dockerfile location)
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

// Define the container image for the service
const image = new docker.Image(`${prefixName}-image`, {
    imageName: pulumi.interpolate`${registry.loginServer}/${imageName}:${imageTag}`,
    build: {
        context: appPath, // Path to the app (Dockerfile location)
        platform: 'linux/amd64', // Ensure it runs on Linux
    },
    registry: {
        server: registry.loginServer,
        username: registryCredentials.username,
        password: registryCredentials.password,
    },
});

// Export the container image name (for reference)
export const containerImage = image.imageName;
