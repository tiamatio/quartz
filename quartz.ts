import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { plevExplorer } from "./plugins/plev-book/explorer.js"

// The sidebar order and names of the plev book. The docs suggest
// ExternalPlugin.Explorer({...}), but the generated plugin index re-exports
// Explorer as is, so that call registers nothing; the layout reads overrides
// under the plugin's source name, which is what this sets. Must run before
// loadQuartzLayout().
componentRegistry.setOptionOverrides("@quartz-community/explorer", plevExplorer)

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
