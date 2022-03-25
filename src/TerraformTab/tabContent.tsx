import * as SDK from "azure-devops-extension-sdk";
import {
  Attachment,
  Build,
  BuildRestClient,
  BuildStatus,
} from "azure-devops-extension-api/Build";
import { getClient } from "azure-devops-extension-api";

SDK.init();
SDK.ready().then(() => {
  try {
    const config = SDK.getConfiguration();
    if (typeof config.onBuildChanged === "function") {
      config.onBuildChanged(async (build: Build) => {
        document.getElementById("progress-message").innerText =
          "Fetching Terraform Plan..";
        let buildAttachmentClient = new BuildAttachmentClient(build);
        buildAttachmentClient
          .init()
          .then(() => {
            displayReports(buildAttachmentClient);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    }
  } catch (error) {
    console.log(error);
  }
});

function displayReports(attachmentClient: BuildAttachmentClient) {
  let attachments = attachmentClient.fetchAttachments();
  let indexAttachment = attachments.find((x) => x.name == "output.txt");
  if (indexAttachment) {
    attachmentClient.downloadAttachment(indexAttachment).then((content) => {
      let colours = new Map<string, string>([
        ["1", "bold"],
        ["30", "black"],
        ["31", "red"],
        ["32", "green"],
        ["33", "yellow"],
        ["34", "blue"],
        ["35", "magenta"],
        ["36", "cyan"],
        ["37", "white"],
        ["90", "grey"],
      ]);

      let output = content.replace(/.\[(3[0-7]|90|1)m/g, function (x) {
        let regExp = new RegExp(/.\[(3[0-7]|90|1)m/g);
        let colour = regExp.exec(x);
        let colourCode = colour[1];
        return `<span class="${colours.get(colourCode)}">`;
      });

      output = output.replace(/.\[0m/g, "</span>");

      var newDoc = document.open("text/html", "replace");
      newDoc.write(
        '<html><head><meta charset="utf-8" /><link rel="stylesheet" href="tabContent.css"></head><body><pre><code>' +
        output +
        "</code></pre></body></html>"
      );
      newDoc.close();
    });
  } else {
    document.getElementById("progress-message").innerText =
      "Failed to fetch report.";
  }
}

class BuildAttachmentClient {
  private build: Build;
  private authHeaders: Object = undefined;
  public attachments: Attachment[] = undefined;

  constructor(build: Build) {
    this.build = build;
  }

  public async init() {
    this.attachments = await this.getAttachments();
  }

  private async getAttachments() {
    console.log("Get attachment list");
    const buildClient: BuildRestClient = getClient(BuildRestClient);
    return await buildClient.getAttachments(
      this.build.project.id,
      this.build.id,
      "terraform.plan"
    );
  }

  public fetchAttachments() {
    if (this.attachments == undefined) {
      this.getAttachments().then((attachments) => {
        this.attachments = attachments;
      });
    }

    return this.attachments;
  }

  private async getAuthHeaders(): Promise<Object> {
    if (this.authHeaders === undefined) {
      console.log("Get access token");
      const accessToken = await SDK.getAccessToken();
      const b64encodedAuth = Buffer.from(":" + accessToken).toString("base64");
      this.authHeaders = {
        headers: { Authorization: "Basic " + b64encodedAuth },
      };
    }
    return this.authHeaders;
  }

  public async downloadAttachment(attachment: Attachment): Promise<string> {
    const headers = await this.getAuthHeaders();
    console.log("downloading:");
    console.log(attachment);
    const response = await fetch(attachment._links.self.href, headers);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    console.log("repsonse");
    console.log(response);
    return await response.text();
  }
}
