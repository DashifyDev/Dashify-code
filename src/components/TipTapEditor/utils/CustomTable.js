import { Table } from '@tiptap/extension-table';
import { findParentNode, mergeAttributes } from '@tiptap/core';

export const CustomTable = Table.extend({
  name: 'table',
  
  addOptions: () => ({
    ...Table.options,
    resizable: false, 
  }),

  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: 'default', 
        parseHTML: (element) => element.style.width === '100%' ? 'full-width' : 'default',
      },
      layoutMode: {
        default: 'fixed', 
        parseHTML: (element) => element.style.tableLayout || 'fixed',
      },
    };
  },
  
  renderHTML({ node, HTMLAttributes }) {
    const finalAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    
    let style = finalAttributes.style || '';
    style = style.replace(/width:[^;]+;?/, '').replace(/table-layout:[^;]+;?/, '').trim();
    
    if (node.attrs.layout === 'full-width') {
      style += (style ? '; ' : '') + 'width: 100%;';
    } else {
      style += (style ? '; ' : '') + 'width: auto;';
    }
    
    style += (style ? '; ' : '') + `table-layout: ${node.attrs.layoutMode};`;
    
    finalAttributes.style = style;

    return [
        'div',
        { class: 'tableWrapper' },
        ['table', finalAttributes, ['tbody', 0]],
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleTableLayout: () => ({ state, dispatch }) => {
        const table = findParentNode(node => node.type.name === 'table')(state.selection);
        if (!table) return false;

        const newLayout = table.node.attrs.layout === 'full-width' ? 'default' : 'full-width';
        const tr = state.tr.setNodeMarkup(table.pos, undefined, { ...table.node.attrs, layout: newLayout });
        
        if (dispatch) dispatch(tr);
        return true;
      },
      toggleLayoutMode: () => ({ state, dispatch }) => {
        const table = findParentNode(node => node.type.name === 'table')(state.selection);
        if (!table) return false;

        const newMode = table.node.attrs.layoutMode === 'fixed' ? 'auto' : 'fixed';

        const tr = state.tr.setNodeMarkup(table.pos, undefined, { ...table.node.attrs, layoutMode: newMode });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});