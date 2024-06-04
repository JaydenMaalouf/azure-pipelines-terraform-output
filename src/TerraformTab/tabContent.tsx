import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Card } from "azure-devops-ui/Card";
import { Page } from "azure-devops-ui/Page";
import { Dropdown, DropdownCallout, DropdownExpandableButton } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem, ListBoxItemType, LoadingCell } from "azure-devops-ui/ListBox";
import { Observer } from "azure-devops-ui/Observer";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { GroupedItemProvider } from "azure-devops-ui/Utilities/GroupedItemProvider";
import { Attachment, Build, BuildRestClient } from "azure-devops-extension-api/Build";
import { Location } from "azure-devops-ui/Utilities/Position";
import { ReleaseEnvironment, ReleaseRestClient, ReleaseTaskAttachment } from "azure-devops-extension-api/Release";
import { getClient, CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { ITableColumn } from "azure-devops-ui/Table";
import "./tabContent.scss";
import "azure-devops-ui/Core/override.css";

SDK.init();

SDK.ready().then(() => {
  try {
    const config = SDK.getConfiguration();
    if (typeof config.releaseEnvironment === "object") {
      var attachmentClient = new ReleaseAttachmentClient(config.releaseEnvironment);
      ReactDOM.render(
        <ReportPanel attachmentClient={attachmentClient} />,
        document.getElementById("terraform-container")
      );
    }
    else if (typeof config.onBuildChanged === "function") {
      config.onBuildChanged(async (build: Build) => {
        var attachmentClient = new PipelineAttachmentClient(build);
        ReactDOM.render(
          <ReportPanel attachmentClient={attachmentClient} />,
          document.getElementById("terraform-container")
        );
      });
    }
  } catch (error) {
    console.error(error);
  }
});

interface ReportPanelProps<T extends AttachmentType> {
  attachmentClient: BaseAttachmentClient<T>;
}

class ReportPanel<T extends AttachmentType> extends React.Component<ReportPanelProps<T>> {
  private selection = new DropdownSelection();
  private content = new ObservableValue<string>("");
  private loading = new ObservableValue<boolean>(false);
  private loadingItem: IListBoxItem = {
    id: "loading",
    type: ListBoxItemType.Loading,
    render: (
      rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IListBoxItem<{}>>,
      tableItem: IListBoxItem<{}>
    ) => {
      return (
        <LoadingCell
          key={rowIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          tableItem={tableItem}
          onMount={this.loadAttachments}
        />
      );
    }
  };
  private itemProvider = new GroupedItemProvider([this.loadingItem], [], true);

  constructor(props: ReportPanelProps<T>) {
    super(props);
  }

  public render() {
    return (
      <Surface background={SurfaceBackground.neutral}>
        <Page className="flex-grow">
          <div className="page-content page-content-top">
            <div style={{ marginBottom: "8px" }}>
              <Dropdown
                ariaLabel="Loading"
                items={this.itemProvider}
                loading={this.loading}
                placeholder="Select an output file"
                selection={this.selection}
                onSelect={this.onSelect}
                width={250}
                renderCallout={props => (
                  <DropdownCallout
                    {...props}
                    dropdownOrigin={{
                      horizontal: Location.start,
                      vertical: Location.start
                    }}
                    anchorOrigin={{
                      horizontal: Location.start,
                      vertical: Location.end
                    }}
                  />
                )}
                renderExpandable={(props) => (
                  <DropdownExpandableButton {...props} />
                )}
              />
            </div>
            <Observer content={this.content}>
              {(props: { content: string; }) => {
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
    const attachment = this.props.attachmentClient.getAttachment(item.id);
    this.setAttachment(attachment);
  };

  private setAttachment(attachment: any) {
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
    if (!this.loading.value) {
      this.loading.value = true;
      await this.props.attachmentClient.fetchAttachments();
      const attachmentNames: IListBoxItem<{}>[] = this.props.attachmentClient
        .getAttachments()
        .map((attachment) => ({
          id: attachment.name,
          text: attachment.name
        }));
      this.itemProvider.pop();
      this.itemProvider.push(...attachmentNames);
      this.loading.value = false;
    }
  };
}

type AttachmentType = {
  _links: any;
  name: string;
};

abstract class BaseAttachmentClient<T extends AttachmentType> {
  private authHeaders: Object = undefined;
  protected attachments: T[] = [];

  abstract fetchAttachments(): Promise<void>;

  public getAttachments() {
    return this.attachments;
  }

  public getAttachment(attachmentName: string) {
    return this.attachments.find((x) => x.name == attachmentName);
  }

  private async getAuthHeaders(): Promise<Object> {
    if (this.authHeaders === undefined) {
      const accessToken = await SDK.getAccessToken();
      const b64encodedAuth = Buffer.from(":" + accessToken).toString("base64");
      this.authHeaders = {
        headers: { Authorization: "Basic " + b64encodedAuth },
      };
    }
    return this.authHeaders;
  }

  public async downloadAttachment(attachment: T): Promise<string> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(attachment._links.self.href, headers);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.text();
  }
}

class PipelineAttachmentClient extends BaseAttachmentClient<Attachment> {
  private build: Build;

  constructor(build: Build) {
    super();
    this.build = build;
  }

  async fetchAttachments() {
    const buildClient: BuildRestClient = getClient(BuildRestClient);
    this.attachments = await buildClient.getAttachments(
      this.build.project.id,
      this.build.id,
      "terraform.plan"
    );
  }
}

class ReleaseAttachmentClient extends BaseAttachmentClient<ReleaseTaskAttachment> {
  private releaseEnvironment: ReleaseEnvironment;

  constructor(releaseEnvironment: ReleaseEnvironment) {
    super();
    this.releaseEnvironment = releaseEnvironment;
  }

  async fetchAttachments() {
    const releaseClient: ReleaseRestClient = getClient(ReleaseRestClient);

    const releaseId = this.releaseEnvironment.releaseId;

    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    const project = await projectService.getProject();
    const release = await releaseClient.getRelease(project.id, releaseId);

    const environmentId = this.releaseEnvironment.id;
    const environment = release.environments.filter((e) => e.id === environmentId)[0];

    try {
      if (!environment.deploySteps || environment.deploySteps.length == 0) {
        throw new Error("This release has not been deployed yet");
      }

      const deployStep = environment.deploySteps[environment.deploySteps.length - 1];
      if (!deployStep.releaseDeployPhases || deployStep.releaseDeployPhases.length == 0) {
        throw new Error("This release has no job");
      }

      const runPlanIds = deployStep.releaseDeployPhases.map(phase => phase.runPlanId);
      if (runPlanIds.length == 0) {
        throw new Error("There are no plan IDs");
      }

      let attachments: ReleaseTaskAttachment[] = [];
      await Promise.all(runPlanIds.map(async (runPlanId) => {
        try {
          if (runPlanId == null) {
            return;
          }

          const result = await releaseClient.getReleaseTaskAttachments(
            project.id,
            environment.releaseId,
            environment.id,
            deployStep.attempt,
            runPlanId,
            "terraform.plan"
          );

          if (!result || result.length == 0) {
            return;
          }

          attachments = attachments.concat(result);
        }
        catch (error) {
          console.error(`Failed to get attachments for ${runPlanId}`, error);
        }
      }));

      this.attachments = attachments;
    } catch (error) {
      console.error('Unable to load Terraform Markdown Plan(s)', error);
    }
  }
}
