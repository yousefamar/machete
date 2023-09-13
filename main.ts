import { Plugin } from 'obsidian';
import { CirclesView, VIEW_TYPE_TREE } from './views/CirclesView';

export default class MachetePlugin extends Plugin {
	macheteView: CirclesView;

	async onload() {
    this.registerView(VIEW_TYPE_TREE, (leaf) => {
			this.macheteView = new CirclesView(leaf);

			this.registerEvent(this.app.vault.on('create', () => {
				// console.log('create');
				this.macheteView.reloadFiles();
			}));

			this.registerEvent(this.app.vault.on('modify', () => {
				// console.log('modify');
				this.macheteView.reloadFiles();
			}));

			this.registerEvent(this.app.vault.on('delete', () => {
				// console.log('delete');
				this.macheteView.reloadFiles();
			}));

			this.registerEvent(this.app.vault.on('rename', () => {
				// console.log('rename');
				this.macheteView.reloadFiles();
			}));

			return this.macheteView;
		});

		this.addRibbonIcon("sword", "Machete", async () => {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE_TREE);

			await this.app.workspace.getLeaf(true).setViewState({
				type: VIEW_TYPE_TREE,
				active: true,
			});

			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE)[0]
			);
		});

		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
	}

	onunload() {

	}
}
