const TEST_ID = 'starters_set02_test03';

function getPartKey(part){
  return `${TEST_ID}_part${part}_state`;
}

function getDoneKey(part){
  return `${TEST_ID}_part${part}_done`;
}

function loadPartState(part){
  return JSON.parse(localStorage.getItem(getPartKey(part)) || '{}');
}

function savePartState(part, state){
  localStorage.setItem(getPartKey(part), JSON.stringify(state));
}

function setPartDone(part, isDone){
  if(isDone){
    localStorage.setItem(getDoneKey(part),'true');
  }else{
    localStorage.removeItem(getDoneKey(part));
  }
}

function isPartDone(part){
  return localStorage.getItem(getDoneKey(part)) === 'true';
}

function resetWholeTest(){
  for(let i=1;i<=4;i++){
    localStorage.removeItem(getPartKey(i));
    localStorage.removeItem(getDoneKey(i));
  }
}