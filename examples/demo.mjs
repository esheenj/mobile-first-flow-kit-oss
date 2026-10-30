import {initialState,transition} from '../src/flow.mjs';
let state=initialState();
for(const action of [{type:'SELECT_TEMPLATE',value:'feedback'},{type:'NEXT'}, {type:'EDIT_LABEL',value:'Synthetic feedback'}, {type:'NEXT'}, {type:'NEXT'}]) state=transition(state,action);
console.log(JSON.stringify(state,null,2));


