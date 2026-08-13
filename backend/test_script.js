const stringSimilarity = require('string-similarity');

function classifyNameDifference(formName, ocrName) {
    if (formName === ocrName) {
      return { match: true, status: 'MATCH', confidence: 1.0, reasonCode: 'NAME_EXACT_MATCH' };
    }

    const formTokens = formName.split(' ');
    const ocrTokens = ocrName.split(' ');

    if (formTokens.length > ocrTokens.length) {
      return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_FORM_EXTRA_TOKEN' };
    }

    if (formTokens.length < ocrTokens.length) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.7, reasonCode: 'NAME_FORM_MISSING_TOKEN' };
    }

    let formExtraChars = false;
    let ocrLikelyError = false;
    let minorTypo = false;
    let completelyDifferent = false;

    for (let i = 0; i < formTokens.length; i++) {
      const ft = formTokens[i];
      const ot = ocrTokens[i];
      
      if (ft === ot) continue;

      const similarity = stringSimilarity.compareTwoStrings(ft, ot);
      if (similarity < 0.6) {
        completelyDifferent = true;
        break;
      }

      if (ft.length > ot.length && ft.startsWith(ot) && /^[A-Z]$/.test(ft.replace(ot, '')[0])) {
        const rest = ft.substring(ot.length);
        if (rest.split('').every(c => c === rest[0])) {
          formExtraChars = true; 
        } else {
          minorTypo = true;
        }
      } else if (ot.length > ft.length && ot.startsWith(ft) && /^[A-Z]$/.test(ot.replace(ft, '')[0])) {
        const rest = ot.substring(ft.length);
        if (rest.split('').every(c => c === rest[0])) {
          ocrLikelyError = true; 
        } else {
          minorTypo = true;
        }
      } else {
        minorTypo = true;
      }
    }

    if (completelyDifferent) {
      return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_DIFFERENT' };
    }

    if (formExtraChars) {
      return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_FORM_EXTRA_CHARACTERS' };
    }

    if (minorTypo) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.8, reasonCode: 'NAME_FORM_TYPO' };
    }

    if (ocrLikelyError) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.9, reasonCode: 'NAME_LIKELY_OCR_ERROR' };
    }

    return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_LOW_CONFIDENCE' };
}

console.log(classifyNameDifference('GANGAVARAPU SATISH KUMARRR', 'GANGAVARAPU SATISH KUMAR'));
console.log(classifyNameDifference('GANGAVARAPU SATISH KUMARRR', 'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY'));
console.log(stringSimilarity.compareTwoStrings('GANGAVARAPU SATISH KUMARRR', 'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY'));
