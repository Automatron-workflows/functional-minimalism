// Pure illustration timing. A stage is never evidence that a model built a screen.
export const duration=12000;
const draftAt=[420,1120,1820];
const composeAt=2620;
const resultAt=3220;
const holdAt=4620;
export function filmFrame(milliseconds){
 const t=Math.max(0,Number.isFinite(milliseconds)?milliseconds:0)%duration;
 const drafts=draftAt.map(at=>t>=at);
 const stage=t<composeAt?'source':t<holdAt?'compose':'remember';
 return {stage,drafts,result:t>=resultAt,fading:t>=duration-1100};
}
export function mayAdvance({playing,hidden,visible,dialogOpen}){return playing&&!hidden&&visible&&!dialogOpen;}
