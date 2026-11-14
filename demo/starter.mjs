import {composeBrief,selectDecisions} from '../src/core.mjs';

// Match the reference component destination installed by `setup ../my-app`.
// Export only decisions applicable to this screen; never mutate workshop memory.
export function composeStarterBrief(pack,contract,memory={schema:'design-harness.memory/1',decisions:[]}){
 const target='my-app';
 const starterPack=structuredClone(pack);
 starterPack.components.forEach(component=>{component.source='src/design-system/components.mjs';});
 const decisions=selectDecisions(memory,{pack:pack.id,project:contract.project,screen:contract.id}).map(decision=>{
  const copy={...decision};delete copy.supersedes;
  if(copy.scope==='project')copy.target=target;
  if(copy.scope==='screen')copy.target=`${target}/${contract.id}`;
  return copy;
 });
 return composeBrief(starterPack,{...contract,project:target},{schema:'design-harness.memory/1',decisions},{compact:true});
}
