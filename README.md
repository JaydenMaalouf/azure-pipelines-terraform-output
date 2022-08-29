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
![image](https://user-images.githubusercontent.com/7008565/187106474-ce7d6353-c69b-4d65-bd54-8a230864b537.png)  

#### Select your state file

In the Terraform Plan tab, your associated Terraform Output artifacts will appear in the dropdown box  
The dropdown box is unique to each build, so it won't show previous build artifacts  
![image](https://user-images.githubusercontent.com/7008565/187106547-4cbb9947-0ae2-4dd9-8a0f-7d0b7d56f84b.png)  

Once you have selected your state file, it will show your plan output  
![image](https://user-images.githubusercontent.com/7008565/187106128-f1f7e6d0-9015-4fba-9d3f-49dfaa524505.png)
