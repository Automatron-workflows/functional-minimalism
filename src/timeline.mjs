// Pure illustration timing. A stage is never evidence that a model built a screen.
export const duration=12000;
export function filmFrame(milliseconds){
 const t=Math.max(0,Number.isFinite(milliseconds)?milliseconds:0)%duration;
 const stage=t<2800?'source':t<7200?'compose':'remember';
 return {stage,ready:[t>=2800,t>=4300,t>=5800],progress:Math.min(t/6500,1),caption:stage==='source'?'Start with your system.':stage==='compose'?'Let the task lead.':'Next screen. Same judgment.'};
}
export function mayAdvance({playing,hidden,visible,dialogOpen}){return playing&&!hidden&&visible&&!dialogOpen;}
