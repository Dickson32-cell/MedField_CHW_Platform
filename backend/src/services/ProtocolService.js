/**
 * Protocol Service
 * Implements clinical decision support based on WHO Integrated Community Case Management (iCCM)
 */

class ProtocolService {
    /**
     * Assess symptoms and return clinical guidance
     * @param {Object} assessment symptoms and vital signs
     * @returns {Object} { classification, recommended_actions, danger_signs }
     */
    async assess(assessment) {
        const guidances = [];
        const dangerSigns = [];

        // 1. General Danger Signs (Apply to all)
        if (assessment.unable_to_drink_or_breastfeed ||
            assessment.vomits_everything ||
            assessment.convulsions ||
            assessment.lethargic_or_unconscious) {
            dangerSigns.push('General Danger Sign Detected');
            guidances.push({
                condition: 'Severe Disease',
                classification: 'RED',
                action: 'URGENT REFERRAL to hospital. Give first dose of appropriate antibiotic/antimalarial if protocols allow.'
            });
        }

        // 2. Malaria Assessment
        if (assessment.fever && assessment.rdt_positive) {
            guidances.push({
                condition: 'Malaria',
                classification: 'YELLOW',
                action: 'Treat with ACT. Follow up in 3 days. Return immediately if symptoms worsen.'
            });
        } else if (assessment.fever && !assessment.rdt_positive && !assessment.rdt_done) {
            guidances.push({
                condition: 'Febrile Illness',
                classification: 'YELLOW',
                action: 'Perform RDT if available. If RDT negative or unavailable, assess for other causes of fever.'
            });
        }

        // 3. Pneumonia Assessment (Cough + Fast Breathing)
        if (assessment.cough && assessment.fast_breathing) {
            guidances.push({
                condition: 'Pneumonia',
                classification: 'YELLOW',
                action: 'Treat with Amoxicillin (2x daily for 5 days). Follow up in 2 days.'
            });
        } else if (assessment.cough && assessment.chest_indrawing) {
            dangerSigns.push('[WARNING] Chest Indrawing');
            guidances.push({ condition: 'Severe Pneumonia', classification: 'RED', action: 'URGENT REFERRAL to hospital. Give first dose of Amoxicillin.' });
        }

        // 4. Diarrhea Assessment
        if (assessment.diarrhea) {
            if (assessment.dehydration_signs && assessment.dehydration_signs.length >= 2) {
                guidances.push({
                    condition: 'Diarrhea with Dehydration',
                    classification: 'YELLOW',
                    action: 'Give ORS and Zinc. Follow Plan B if trained. Follow up in 2 days.'
                });
            } else {
                guidances.push({
                    condition: 'Diarrhea',
                    classification: 'GREEN',
                    action: 'Give ORS and Zinc. Follow up in 2 days.'
                });
            }
        }

        return {
            guidances,
            danger_signs: dangerSigns,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new ProtocolService();
