import path = require("path");
import task = require("azure-pipelines-task-lib/task");
import { TaskResult } from "azure-pipelines-task-lib/task";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";

async function run() {
  let terraformPath: string;
  try {
    terraformPath = task.which("terraform", true);
  } catch (err) {
    throw "Terraform CLI not found.";
  }

  const terraformTool = task.tool(terraformPath);
  const outputFilePath = task.getPathInput("outputFilePath");
  const workingDirectory = path.dirname(outputFilePath);
  terraformTool.arg(["show", outputFilePath]);

  const result = terraformTool.execSync(<IExecOptions>{
    cwd: workingDirectory,
    silent: true
  });

  if (result.code != 0) {
    throw `Terraform Output failed with Exit Code: ${result.code}
    Error Message: ${result.error.message}`;
  }

  task.debug(`Output file fetched: ${result.stdout}`);
  const artifactName = task.getInput("artifactName");
  const stagingPath = task.getVariable("Build.ArtifactStagingDirectory") ?? task.getVariable("System.ArtifactsDirectory");
  const outputFile = path.join(stagingPath, artifactName);
  task.writeFile(outputFile, result.stdout);
  task.debug(`Output file written: ${outputFile}`);
  task.addAttachment("terraform.plan", artifactName, outputFile);
  console.log(`Uploaded Plan Output.`);
}

run().then(() => {
  task.setResult(TaskResult.Succeeded, "");
}).catch((error) => {
  task.setResult(TaskResult.Failed, error);
});
