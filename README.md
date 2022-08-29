# Azure Pipelines - Terraform Output

A small plugin that brings a Terraform Plan window into the build results  
The plugin is available on the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=JaydenMaalouf.terraform-output)

## Usage

### YAML definition

Simply call the Terraform Output task with the appropriate inputs
```yaml
- task: TerraformOutput@1
  inputs:
    outputFilePath: example.tfplan
    artifactName: Staging
```

### Build Results

This adds a new tab in the build results  
![image](https://user-images.githubusercontent.com/7008565/187101377-3add161e-5c8d-4229-98e1-8bac50ac15bf.png)

#### Select your state file

In the Terraform Plan tab, your associated Terraform Output artifacts will appear in the dropdown box  
The dropdown box is unique to each build, so it won't show previous build artifacts  
![image](https://user-images.githubusercontent.com/7008565/187101529-e9430663-a3fe-4133-8a90-f1c559fca4d5.png)  

Once you have selected your state file, it will show your plan output  
![image](https://user-images.githubusercontent.com/7008565/187106128-f1f7e6d0-9015-4fba-9d3f-49dfaa524505.png)
