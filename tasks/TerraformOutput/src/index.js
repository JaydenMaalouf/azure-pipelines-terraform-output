"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const task = require("azure-pipelines-task-lib/task");
const task_1 = require("azure-pipelines-task-lib/task");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let terraformPath;
        try {
            terraformPath = task.which("terraform", true);
        }
        catch (err) {
            throw "Terraform CLI not found.";
        }
        const terraformTool = task.tool(terraformPath);
        const outputFilePath = task.getPathInput("outputFilePath");
        const workingDirectory = path.dirname(outputFilePath);
        terraformTool.arg(["show", outputFilePath]);
        const result = terraformTool.execSync({
            cwd: workingDirectory,
            silent: true
        });
        if (result.code != 0) {
            console.log(JSON.stringify(result));
            throw `Terraform Output failed with Exit Code: ${result.code}
    Error Message: ${result.error.message}`;
        }
        task.debug(`Output file fetched: ${result.stdout}`);
        const artifactName = task.getInput("artifactName");
        const outputFile = path.join(task.getVariable("Build.StagingDirectory"), artifactName);
        task.writeFile(outputFile, result.stdout);
        task.debug(`Output file written: ${outputFile}`);
        task.addAttachment("terraform.plan", artifactName, outputFile);
        console.log(`Uploaded Plan Output.`);
    });
}
run().then(() => {
    task.setResult(task_1.TaskResult.Succeeded, "");
}).catch((error) => {
    task.setResult(task_1.TaskResult.Failed, error);
});
