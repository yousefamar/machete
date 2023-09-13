import * as d3 from "d3";
import { ItemView, TAbstractFile, WorkspaceLeaf } from "obsidian";
import { createTree, CirclesVis } from "../utils/datavis";

export const VIEW_TYPE_TREE = "tree-view";

export class CirclesView extends ItemView {
  circlesVis: CirclesVis;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.circlesVis = new CirclesVis();
  }

  getViewType() {
    return VIEW_TYPE_TREE;
  }

  getDisplayText() {
    return "Machete tree view";
  }

  reloadFiles() {
    // list file tree
    const files = this.app.vault.getFiles();

    // container.createEl("pre", { text: JSON.stringify(files, null, 2) });

    const data = files.map((file) => ({
      title: file.basename,
      label: file.basename,
      url: file.path,
      characterCount: file.stat.size,
      fileName: file.name,
      // file: file,
    }));

    this.circlesVis.update(data, this.renameFile.bind(this));
    // const tree = createTree(data);
    // const circles = createCircles(data);
  }

  // async renameFile(file: TAbstractFile, newPath: string) {
  async renameFile(oldPath: string, newPath: string) {
    // const file = this.app.vault.getAbstractFileByPath(oldPath);
    // if (!file) {
    //   console.error("File not found", oldPath);
    //   this.reloadFiles();
    //   return;
    // }
    await this.app.vault.adapter.rename(oldPath, newPath);
    // await this.app.vault.rename(file, newPath);
  }

   

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    // container.createEl("h4", { text: "Example view" });

    this.reloadFiles();
    const node = this.circlesVis.getDomNode();

    const visWrapper = container.createEl('div');
    visWrapper.id = 'vis-wrapper';

    visWrapper.appendChild(node as Node);
    container.appendChild(visWrapper);

    const loadingOverlay = container.createEl('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'spinner-wrapper';
    loadingOverlay.innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';

    container.appendChild(loadingOverlay);
  }

  async onClose() {
    // Nothing to clean up.
  }
}