# Azure Pipelines - Terraform Output

A small plugin that brings a Terraform Plan window into the build results  

## Usage

### YAML definition

Simply call the Terraform Output task with the appropriate inputs
```yaml
- task: TerraformOutput@0
  inputs:
    outputFilePath: example.tfplan
    artifactName: Staging
```

### Build Results

This adds a new tab in the build results  
![image](images/1.png)

#### Select your state file

In the Terraform Plan tab, your associated Terraform Output artifacts will appear in the dropdown box  
The dropdown box is unique to each build, so it won't show previous build artifacts  
![image](images/2.png)  

Once you have selected your state file, it will show your plan output  
![image](images/3.png)
