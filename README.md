# Azure Pipelines - Terraform Output

A small plugin that brings a Terraform Plan window into the pipeline and release results
The plugin is available on the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=JaydenMaalouf.terraform-output)

## Usage

Simply call the Terraform Output task with the appropriate inputs

```yaml
- task: TerraformOutput@1
  inputs:
    outputFilePath: example.tfplan
    artifactName: Staging
```

## Results

A new tab will be available in the results view

| Pipelines              | Releases               |
| ---------------------- | ---------------------- |
| ![image](images/1.png) | ![image](images/4.png) |

### Select your output file

In the Terraform Plan tab, your associated Terraform Output artifacts will appear in the dropdown box  
The dropdown box is unique to each build, so it won't show previous build artifacts  
![image](images/2.png)

Once you have selected your state file, it will show your plan output
![image](images/3.png)
