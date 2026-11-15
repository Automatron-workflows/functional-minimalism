// Guidance adapters, not a replacement component library. No dependency execution.
import {invariant} from './core.mjs';

const adapter=(id,name,kind,packages,docs,roles,rules)=>({id,name,kind,packages,docs,roles,rules});
export const reactAdapters=[
 adapter('shadcn','shadcn/ui','ui',[], 'https://ui.shadcn.com/docs',
  {action:'local Button',field:'local Field + Input',dialog:'local Dialog',collection:'local Table'},
  ['Use the project’s copied components and aliases from components.json. Inspect their actual exports.','Check whether the local components use Base UI, Radix or React Aria; do not guess from the shadcn name.']),
 adapter('radix','Radix Primitives','ui',['radix-ui','@radix-ui/react-*'],'https://www.radix-ui.com/primitives/docs/overview/introduction',
  {action:'native button or existing wrapper',field:'Label + native input',dialog:'Dialog',collection:'existing semantic list/table'},
  ['Keep primitive keyboard/focus behavior and the project’s own styling.','Compose through the installed API; do not assume a styled Button exists in Radix Primitives.']),
 adapter('base-ui','Base UI','ui',['@base-ui/react','@base-ui-components/react'],'https://base-ui.com/react/overview/quick-start',
  {action:'Button',field:'Field + Input',dialog:'Dialog',collection:'existing semantic list/table'},
  ['Use the installed package name and compound component API; legacy package names need version-specific review.','Preserve accessible behavior while applying the project’s tokens.']),
 adapter('react-aria','React Aria Components','ui',['react-aria-components'],'https://react-aria.adobe.com/',
  {action:'Button',field:'TextField + Label + Input',dialog:'Dialog + Modal',collection:'GridList or Table'},
  ['Preserve labels, focus management and selection semantics.','Style states through the project’s existing approach; do not swap in another library’s event props.']),
 adapter('headless-ui','Headless UI','ui',['@headlessui/react'],'https://headlessui.com/react/dialog',
  {action:'Button',field:'Field + Label + Input',dialog:'Dialog',collection:'existing semantic list/table'},
  ['Keep keyboard navigation and focus behavior. Use the installed version’s API.','Headless components supply interaction; the project’s design pack supplies the appearance.']),
 adapter('mui','Material UI','ui',['@mui/material'],'https://mui.com/material-ui/getting-started/',
  {action:'Button / IconButton',field:'TextField',dialog:'Dialog',collection:'Table or List'},
  ['Reuse the existing theme and component overrides.','Keep data-heavy tasks as clear lists or tables; do not turn every row into a decorative card.']),
 adapter('chakra','Chakra UI','ui',['@chakra-ui/react'],'https://chakra-ui.com/docs/components/concepts/overview',
  {action:'Button / IconButton',field:'Field + Input',dialog:'Dialog',collection:'Table or existing list'},
  ['Inspect the installed major: older and current compound APIs differ.','Use the project’s semantic tokens and recipes; preserve field and dialog semantics.']),
 adapter('mantine','Mantine','ui',['@mantine/core'],'https://mantine.dev/core/button/',
  {action:'Button / ActionIcon',field:'TextInput',dialog:'Modal',collection:'Table'},
  ['Reuse MantineProvider theme and project overrides.','Keep useful form labels and error feedback; avoid adding a second theme/provider system.']),
 adapter('antd','Ant Design','ui',['antd'],'https://ant.design/components/overview/',
  {action:'Button',field:'Form.Item + Input',dialog:'Modal',collection:'Table or existing list'},
  ['Keep ConfigProvider tokens, locale and established density.','Preserve table utility, pagination and explicit confirmation where the task requires them.']),
 adapter('tailwind','Tailwind CSS','styling',['tailwindcss'],'https://tailwindcss.com/docs/installation/using-vite',{},
  ['Use the project’s existing token and utility conventions. Tailwind supplies styling, not control semantics.']),
 adapter('motion','Motion','motion',['motion','framer-motion'],'https://motion.dev/docs/react',{},
  ['Use the installed package’s imports. Motion should explain a change caused by an action.','Honor reduced motion; keep the final state understandable without animation.']),
 adapter('lucide','Lucide React','icons',['lucide-react'],'https://lucide.dev/guide/react',{},
  ['Use one coherent icon family. Name icon buttons for assistive technology.','Icon-only controls require a documented familiar meaning; unfamiliar actions retain a visible label.']),
 adapter('react-hook-form','React Hook Form','forms',['react-hook-form'],'https://react-hook-form.com/get-started',{},
  ['Connect the existing form controls using their actual ref/value/event contracts.','Keep labels, units, inline errors and recoverable submitted values.'])
];

export function detectReact(manifest,componentsConfig=null){
 invariant(manifest&&typeof manifest==='object'&&!Array.isArray(manifest),'Invalid package.json');
 for(const key of ['dependencies','devDependencies','peerDependencies'])if(manifest[key]!==undefined)invariant(manifest[key]&&typeof manifest[key]==='object'&&!Array.isArray(manifest[key]),`Invalid ${key}`);
 const dependencies={...(manifest.peerDependencies??{}),...(manifest.devDependencies??{}),...(manifest.dependencies??{})};
 invariant(Object.values(dependencies).every(v=>typeof v==='string'),'Dependency versions must be strings');
 const detected=reactAdapters.flatMap(a=>{
  const matches=Object.entries(dependencies).filter(([name])=>(a.id!=='radix'||name!=='@radix-ui/react-icons')&&a.packages.some(p=>p.endsWith('*')?name.startsWith(p.slice(0,-1)):name===p));
  const configMatch=a.id==='shadcn'&&componentsConfig&&typeof componentsConfig.aliases?.ui==='string';
  return matches.length||configMatch?[{id:a.id,kind:a.kind,packages:Object.fromEntries(matches),...(configMatch?{localAlias:componentsConfig.aliases.ui}:{}),confidence:'declared'}]:[];
 });
 return {schema:'design-harness.react-inventory/1',react:dependencies.react??null,detected,limitations:['Manifest declarations are not installed-version or runtime compatibility evidence. Local shadcn exports and all library APIs require source/typecheck/browser verification.']};
}

export function selectReact(inventory,ui){
 invariant(inventory.react,'React is not declared in this package.json. Run in the application package.');
 const candidates=inventory.detected.filter(a=>a.kind==='ui');
 // shadcn wraps a primitive layer; those declarations do not mean two UI systems.
 const choices=candidates.some(a=>a.id==='shadcn')?candidates.filter(a=>!['radix','base-ui','react-aria'].includes(a.id)):candidates;
 const selected=ui??(choices.length===1?choices[0].id:undefined);
 invariant(selected,choices.length?'Multiple UI systems detected. Select --ui explicitly.':'No supported UI library detected. Keep native/custom components or add a registry adapter.');
 invariant(candidates.some(a=>a.id===selected),`UI adapter ${selected} is not declared by this project`);
 return {schema:'design-harness.react-connection/1',ui:selected,inventory};
}

export function composeReactContext(connection){
 invariant(connection?.schema==='design-harness.react-connection/1','Unsupported React connection');
 const selection=selectReact(connection.inventory,connection.ui);
 const ids=[selection.ui,...connection.inventory.detected.filter(a=>a.kind!=='ui').map(a=>a.id)];
 const sections=ids.map(id=>{
  const a=reactAdapters.find(a=>a.id===id),observed=connection.inventory.detected.find(a=>a.id===id);
  invariant(a&&observed,`Unknown React adapter: ${id}`);
  return `${a.name}: ${Object.entries(observed.packages).map(([p,v])=>`${p}@${v}`).join(', ')||observed.localAlias}\n${Object.entries(a.roles).map(([role,value])=>`${role} → ${value}`).join('; ')}\n${a.rules.join(' ')}\nAPI reference: ${a.docs}`;
 });
 const backing=selection.ui==='shadcn'?connection.inventory.detected.filter(a=>['radix','base-ui','react-aria'].includes(a.id)).flatMap(a=>Object.entries(a.packages).map(([p,v])=>`${p}@${v}`)):[];
 return `## React implementation context\n${sections.join('\n\n')}${backing.length?`\nBacking primitives declared: ${backing.join(', ')}. Verify the local component imports.`:''}\n\nUse local pack source mappings as the authority. Component names above are role guidance, not verified imports. Read installed types/source before choosing props. Run the app’s typecheck and render it. Do not install competing libraries or migrate the design system to follow this brief.\n`;
}
