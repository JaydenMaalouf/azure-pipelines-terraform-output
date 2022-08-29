import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Card } from "azure-devops-ui/Card";
import { Page } from "azure-devops-ui/Page";
import { Dropdown, DropdownExpandableButton } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Observer } from "azure-devops-ui/Observer";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { Attachment, Build, BuildRestClient } from "azure-devops-extension-api/Build";
import { getClient } from "azure-devops-extension-api";
import "./tabContent.scss";
import "azure-devops-ui/Core/override.css";

SDK.init();
SDK.ready().then(() => {
  try {
    const config = SDK.getConfiguration();
    if (typeof config.onBuildChanged === "function") {
      config.onBuildChanged(async (build: Build) => {
        var attachmentClient = new TerraformAttachmentClient(build);
        ReactDOM.render(
          <ReportPanel attachmentClient={attachmentClient} />,
          document.getElementById("terraform-container")
        );
      });
    }
  } catch (error) {
    console.log(error);
  }
});

interface ReportPanelProps {
  attachmentClient: TerraformAttachmentClient;
}

class ReportPanel extends React.Component<ReportPanelProps> {
  private selection = new DropdownSelection();
  private content = new ObservableValue<string>("");
  private items = new ObservableArray<string>();

  constructor(props: ReportPanelProps) {
    super(props);

    this.loadAttachments();
  }

  public render() {
    return (
      <Surface background={SurfaceBackground.neutral}>
        <Page className="flex-grow">
          <div className="page-content page-content-top">
            <div style={{ marginBottom: "8px" }}>
              <Dropdown
                selection={this.selection}
                items={this.items.value}
                placeholder="Select a state file"
                onSelect={this.onSelect}
                renderExpandable={(props) => (
                  <DropdownExpandableButton {...props} />
                )}
              />
            </div>
            <Observer content={this.content}>
              {(props: { content: string }) => {
                if (!props.content) {
                  return <div></div>;
                }

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

                let output = props.content.replace(
                  /.\[(3[0-7]|90|1)m/g,
                  function (x) {
                    let regExp = new RegExp(/.\[(3[0-7]|90|1)m/g);
                    let colour = regExp.exec(x);
                    let colourCode = colour[1];
                    return `<span class="${colours.get(colourCode)}">`;
                  }
                );

                output = output.replace(/.\[0m/g, "</span>");
                output = output.trim();
                return (
                  <Card>
                    <pre dangerouslySetInnerHTML={{ __html: output }}></pre>
                  </Card>
                );
              }}
            </Observer>
          </div>
        </Page>
      </Surface>
    );
  }

  private onSelect = (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    console.log(`item selected ${item.id}`);
    const attachment = this.props.attachmentClient.getAttachment(item.id);
    this.setAttachment(attachment);
  };

  private setAttachment(attachment: Attachment) {
    if (attachment == null) {
      return;
    }

    this.props.attachmentClient
      .downloadAttachment(attachment)
      .then((attachmentContent) => {
        this.content.value = attachmentContent;
        this.forceUpdate();
      });
  }

  private loadAttachments = async () => {
    await this.props.attachmentClient.init();
    this.items.value = this.props.attachmentClient
      .getAttachments()
      .map((attachment) => attachment.name);
    this.forceUpdate();
  };
}

class TerraformAttachmentClient {
  private build: Build;
  private authHeaders: Object = undefined;
  public attachments: Attachment[] = undefined;

  constructor(build: Build) {
    this.build = build;
  }

  public async init() {
    await this.fetchAttachments();
  }

  private async fetchAttachments() {
    console.log("Get attachment list");
    const buildClient: BuildRestClient = getClient(BuildRestClient);
    this.attachments = await buildClient.getAttachments(
      this.build.project.id,
      this.build.id,
      "terraform.plan"
    );
    console.log(JSON.stringify(this.attachments));
  }

  public getAttachments() {
    return this.attachments;
  }

  public getAttachment(attachmentName: string) {
    return this.attachments.find((x) => x.name == attachmentName);
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
