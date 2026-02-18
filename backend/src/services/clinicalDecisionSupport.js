/**
 * Clinical Decision Support Service
 * WHO iCCM (Integrated Community Case Management) Protocols
 */

class ClinicalDecisionSupport {
  /**
   * WHO iCCM Protocol: Assess Child with Fever
   */
  assessFever(child) {
    const findings = [];
    const dangerSigns = [];
    const actions = [];

    // Check danger signs
    if (child.convulsions) {
      dangerSigns.push('Convulsions');
      actions.push('Refer URGENTLY to facility');
    }

    if (child.lethargy || child.unconscious) {
      dangerSigns.push('Lethargy/Unconscious');
      actions.push('Refer URGENTLY to facility');
    }

    if (child.notAbleToDrink || child.breastfeedingStopped) {
      dangerSigns.push('Unable to drink');
      actions.push('Refer URGENTLY to facility');
    }

    if (child.vomitingEverything) {
      dangerSigns.push('Vomiting everything');
      actions.push('Refer URGENTLY to facility');
    }

    // Check for severe dehydration if diarrhea present
    if (child.hasDiarrhea) {
      if (child.sunkenEyes) {
        findings.push('Sunken eyes - signs of dehydration');
      }
      if (child.skinPinchReturnsSlowly) {
        findings.push('Skin pinch returns slowly - signs of dehydration');
      }
    }

    // Temperature assessment
    if (child.temperature >= 38) {
      findings.push(`Fever (${child.temperature}°C)`);

      if (child.duration >= 7) {
        actions.push('Refer for malaria test');
      }

      if (child.duration >= 2 && child.rash) {
        actions.push('Possible measles - refer');
      }
    }

    // Determine classification
    let classification = 'SIMPLE_ILLNESS';
    if (dangerSigns.length > 0) {
      classification = 'SEVERE_ILLNESS';
    } else if (child.hasDiarrhea && (child.sunkenEyes || child.skinPinchReturnsSlowly)) {
      classification = 'SOME_DEHYDRATION';
    } else if (child.hasDiarrhea) {
      classification = 'NO_DEHYDRATION';
    }

    return {
      dangerSigns,
      findings,
      actions,
      classification,
      refer: dangerSigns.length > 0
    };
  }

  /**
   * WHO iCCM Protocol: Assess Child with Cough/Difficulty Breathing
   */
  assessCough(child) {
    const findings = [];
    const actions = [];
    const dangerSigns = [];

    // Danger signs
    if (child.convulsions || child.lethargy || child.unconscious) {
      dangerSigns.push('General danger sign');
      actions.push('Refer URGENTLY to facility');
    }

    // Breathing difficulty
    if (child.chestIndrawing) {
      findings.push('Chest indrawing');
      actions.push('Refer to facility for pneumonia treatment');
    }

    if (child.stridor) {
      findings.push('Stridor');
      actions.push('Refer URGENTLY - airway obstruction');
    }

    if (child.rapidBreathing) {
      const age = this.calculateAge(child.dob);
      const threshold = age < 12 ? 50 : age < 60 ? 40 : 30;

      if (child.respiratoryRate > threshold) {
        findings.push(`Rapid breathing (${child.respiratoryRate}/min)`);
        actions.push('Treat for pneumonia with antibiotics');
      }
    }

    // Runny nose alone
    if (child.cough && !child.rapidBreathing && !child.chestIndrawing) {
      findings.push('Cough/cold symptoms');
      actions.push('No antibiotics needed - supportive care');
    }

    return {
      dangerSigns,
      findings,
      actions,
      classification: dangerSigns.length > 0 ? 'SEVERE_PNEUMONIA' : findings.some(f => f.includes('pneumonia')) ? 'PNEUMONIA' : 'NO_PNEUMONIA',
      refer: dangerSigns.length > 0 || child.chestIndrawing
    };
  }

  /**
   * WHO iCCM Protocol: Assess Diarrhea
   */
  assessDiarrhea(child) {
    const findings = [];
    const actions = [];

    // Duration
    if (child.duration >= 14) {
      findings.push('Diarrhea for 14+ days - persistent diarrhea');
      actions.push('Refer for assessment');
    }

    // Dehydration assessment
    if (child.sunkenEyes || child.skinPinchReturnsSlowly || child.drinkAverse) {
      findings.push('Signs of dehydration');
      actions.push('ORS and zinc supplementation');
    }

    if (child.sunkenEyes && child.skinPinchReturnsSlowly) {
      findings.push('Severe dehydration');
      actions.push('Refer URGENTLY with IV fluids');
    }

    // Blood in stool
    if (child.bloodInStool) {
      findings.push('Bloody diarrhea');
      actions.push('Treat with antibiotics - possible dysentery');
    }

    return {
      findings,
      actions,
      classification: child.bloodInStool ? 'DYSENTERY' : child.sunkenEyes && child.skinPinchReturnsSlowly ? 'SEVERE_DEHYDRATION' : child.sunkenEyes || child.skinPinchReturnsSlowly ? 'SOME_DEHYDRATION' : 'NO_DEHYDRATION',
      refer: child.bloodInStool || (child.sunkenEyes && child.skinPinchReturnsSlowly)
    };
  }

  /**
   * WHO iCCM Protocol: Assess Malnutrition
   */
  assessNutrition(child) {
    const findings = [];
    const actions = [];

    // Visible severe wasting
    if (child.visibleSevereWasting) {
      findings.push('Visible severe wasting');
      actions.push('Refer to facility - severe acute malnutrition');
    }

    // MUAC screening
    if (child.muac) {
      if (child.muac < 115) {
        findings.push(`MUAC: ${child.muac}mm - Severe malnutrition`);
        actions.push('Refer to facility');
      } else if (child.muac < 125) {
        findings.push(`MUAC: ${child.muac}mm - Moderate malnutrition`);
        actions.push('Ready-to-use therapeutic food');
      }
    }

    // Edema
    if (child.bilateralPittingEdema) {
      findings.push('Bilateral pitting edema - Kwashiorkor');
      actions.push('Refer URGENTLY to facility');
    }

    return {
      findings,
      actions,
      classification: child.bilateralPittingEdema || child.visibleSevereWasting ? 'SEVERE_ACUTE_MALNUTRITION' : child.muac < 125 ? 'MODERATE_ACUTE_MALNUTRITION' : 'NO_MALNUTRITION',
      refer: child.bilateralPittingEdema || child.visibleSevereWasting || (child.muac && child.muac < 115)
    };
  }

  /**
   * WHO iCCM Protocol: Assess Pregnancy
   */
  assessPregnancy(pregnantWoman) {
    const findings = [];
    const actions = [];
    const dangerSigns = [];

    // Calculate weeks of pregnancy
    const weeksPregnant = Math.floor((new Date() - new Date(pregnantWoman.lastMenstrualPeriod)) / (7 * 24 * 60 * 60 * 1000));

    // Danger signs in pregnancy
    if (pregnantWoman.vaginalBleeding) {
      dangerSigns.push('Vaginal bleeding');
      actions.push('Refer URGENTLY to facility');
    }

    if (pregnantWoman.severeHeadache || pregnantWoman.blurredVision) {
      dangerSigns.push('Severe headache/blurred vision - possible pre-eclampsia');
      actions.push('Refer URGENTLY to facility');
    }

    if (pregnantWoman.convulsions) {
      dangerSigns.push('Convulsions - eclampsia');
      actions.push('Refer URGENTLY - emergency');
    }

    if (pregnantWoman.severeAbdominalPain) {
      dangerSigns.push('Severe abdominal pain');
      actions.push('Refer URGENTLY to facility');
    }

    if (pregnantWoman.swellingFaceHands) {
      dangerSigns.push('Swelling of face/hands');
      actions.push('Refer for pre-eclampsia assessment');
    }

    if (pregnantWoman.reducedFetalMovement !== undefined && !pregnantWoman.reducedFetalMovement) {
      dangerSigns.push('Reduced fetal movement');
      actions.push('Refer for fetal assessment');
    }

    // Check for first ANC visit
    if (weeksPregnant <= 12) {
      findings.push('First trimester');
      actions.push('Register for ANC, give iron/folate');
    }

    // Tetanus protection
    if (pregnantWoman.tetanusDoses < 2) {
      findings.push('Needs tetanus vaccination');
      actions.push('Administer TT vaccine');
    }

    // Deworming
    if (weeksPregnant >= 12 && weeksPregnant <= 28) {
      actions.push('Deworming (albendazole)');
    }

    return {
      dangerSigns,
      findings,
      actions,
      classification: dangerSigns.length > 0 ? 'EMERGENCY' : 'NORMAL_PREGNANCY',
      refer: dangerSigns.length > 0,
      weeksPregnant
    };
  }

  /**
   * Get treatment protocol for pneumonia
   */
  getPneumoniaTreatment(child) {
    const age = this.calculateAge(child.dob);

    if (age < 2) {
      return {
        antibiotic: 'Amoxicillin suspension',
        dose: '250mg twice daily',
        duration: '5 days',
        followUp: 'Review in 2 days'
      };
    } else if (age < 5) {
      return {
        antibiotic: 'Amoxicillin suspension',
        dose: '500mg twice daily',
        duration: '5 days',
        followUp: 'Review in 2 days'
      };
    }
  }

  /**
   * Get treatment protocol for diarrhea
   */
  getDiarrheaTreatment(child) {
    return {
      ors: 'ORS solution - give after each loose stool',
      zinc: 'Zinc tablets 20mg daily for 10 days',
      feeding: 'Continue breastfeeding, give nutritious food',
      refer: child.sunkenEyes && child.skinPinchReturnsSlowly
    };
  }

  /**
   * Calculate age in months
   */
  calculateAge(dob) {
    const months = (new Date() - new Date(dob)) / (30.44 * 24 * 60 * 60 * 1000);
    return Math.floor(months);
  }
}

module.exports = new ClinicalDecisionSupport();
