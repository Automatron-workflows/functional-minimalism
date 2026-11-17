// Pure illustration timing. A stage is never evidence that a model built a screen.
export const duration=16100;
const models=['claude','chatgpt','kimi','deepseek'];
const cycle=3000;
const scanStart=1100;
const scanEnd=1900;
const settledAt=cycle*models.length;
export function filmFrame(milliseconds){
 const t=Math.max(0,Number.isFinite(milliseconds)?milliseconds:0)%duration;
 const settled=t>=settledAt;
 const index=settled?models.length-1:Math.min(Math.floor(t/cycle),models.length-1);
 const local=settled?cycle:t%cycle;
 const wipe=local<scanStart?0:local<scanEnd?Math.min((local-scanStart)/(scanEnd-scanStart),1):1;
 const stage=settled?'remember':local<scanStart?'source':local<scanEnd?'compose':'result';
 const done=settled?models.length:stage==='result'?index+1:index;
 return {stage,model:settled?'all':models[index],wipe,done,settled,fading:t>=duration-1100};
}
export function mayAdvance({playing,hidden,visible,dialogOpen}){return playing&&!hidden&&visible&&!dialogOpen;}
