// Pure illustration timing. A stage is never evidence that a model built a screen.
export const duration=14500;
const models=['claude','chatgpt','kimi','deepseek'];
const cycle=2600;
const wipeStart=1400;
const wipeEnd=2300;
const settledAt=cycle*models.length;
export function filmFrame(milliseconds){
 const t=Math.max(0,Number.isFinite(milliseconds)?milliseconds:0)%duration;
 const settled=t>=settledAt;
 const index=settled?models.length-1:Math.min(Math.floor(t/cycle),models.length-1);
 const local=settled?cycle:t%cycle;
 const wipe=settled?1:local<wipeStart?0:Math.min((local-wipeStart)/(wipeEnd-wipeStart),1);
 return {stage:settled?'remember':local<wipeStart?'source':'compose',model:settled?'all':models[index],wipe,settled,fading:t>=duration-1100};
}
export function mayAdvance({playing,hidden,visible,dialogOpen}){return playing&&!hidden&&visible&&!dialogOpen;}
