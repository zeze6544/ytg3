export type Chapter = { id: string; title: string; paragraphs: string[] };

const CLASSES: Record<string, Chapter> = {
  opioid: {
    id: "opioid",
    title: "Opioid chapter",
    paragraphs: [
      "Opioids act on opioid receptors. The effect people notice is pain relief, a warm sedation, or both. The effect that kills is slowed or stopped breathing. The drive to breathe falls before the person looks dramatically unwell, and a gurgling snore can be the airway closing.",
      "Overdose signs are slow or stopped breathing, blue or grey lips, pale or clammy skin, pinpoint pupils, and a person who will not wake. That is an emergency. Naloxone can reverse the opioid part and often needs repeating, because it wears off while the opioid is still present. Naloxone does not reverse benzodiazepines, alcohol, xylazine, or other sedatives mixed into the same episode.",
      "Non-pharmaceutical opioids are not a stable product. Heroin, counterfeit tablets, and powders sold under other names have contained fentanyl, nitazenes, and xylazine. A previous bag from the same seller is not a measurement of the next one. A gap in use lowers tolerance, so a familiar amount after abstinence is a common overdose pattern. This file has no dose.",
      "The deadliest mixes are other opioids, benzodiazepines, alcohol, GHB, and other sedatives. The breathing risk is not an average of the two. A stimulant can hide the sedation for a while and the opioid can still stop breathing when that masking thins. Do not use alone. Tell another person where naloxone is and how to use it, and how to contact local emergency services.",
      "Dependence shows up as needing the opioid to feel normal, and withdrawal as aches, sweating, diarrhoea, insomnia, and craving. Withdrawal is miserable. Stopped breathing is the emergency. Methadone and buprenorphine are medical treatments for opioid dependence. This archive does not turn them into a regimen, and it does not describe how to make, extract, or obtain an opioid.",
    ],
  },
  stimulant: {
    id: "stimulant",
    title: "Stimulant chapter",
    paragraphs: [
      "Stimulants speed the nervous system. Heart rate, blood pressure, and temperature rise. The wanted effect is alertness or euphoria. The harms are overheating, chest pain, a heart rhythm problem, seizure, agitation, and a paranoid or psychotic state that can outlast the drug.",
      "Overheating is easy to miss in a hot room, a crowd, or while dancing. Hot dry skin, confusion, pounding pulse, and collapse need emergency cooling and emergency services. Chest pain is not a panic symptom to wait out. Drinking a huge volume of plain water without salt can itself cause a seizure, so thirst is not a target.",
      "A second stimulant stacks the same strain. Caffeine, cocaine, amphetamines, and MDMA-type drugs are not separate compartments. A beta blocker does not make cocaine safe. A sedative or opioid beside a stimulant can hide how sedated the person is until breathing fails. Sleep debt, dehydration, and several days awake make the heart and the paranoia worse.",
      "The comedown can include low mood, hunger, and a strong wish to take more. That wish is not information about the strength of the next dose. This file has no dose, no source, and no preparation.",
    ],
  },
  depressant: {
    id: "depressant",
    title: "Depressant chapter",
    paragraphs: [
      "Depressants slow the brain. Alcohol, GHB, GBL, barbiturates, and related sedatives sit here. They relax, impair memory, and can stop breathing. The person may look asleep. A person who cannot be woken, or whose breathing is slow, is in an emergency.",
      "Two depressants multiply. Alcohol plus GHB, a barbiturate, a benzodiazepine, or an opioid is a classic fatal pattern. Vomiting while sedated causes choking. Do not leave someone on their back if they are heavily sedated and vomiting. Recovery position and emergency services come before any argument about what they took.",
      "GHB and GBL have a steep response. A small difference in the liquid, or redosing because the first wave felt mild, is how overdoses happen. This file states no amount. Alcohol hidden in the same night still counts as a second depressant.",
      "Withdrawal from heavy, repeated alcohol or barbiturate use can cause tremor, seizure, and delirium. That withdrawal is a medical emergency, not a weekend to push through. This archive does not describe a taper.",
    ],
  },
  benzodiazepine: {
    id: "benzodiazepine",
    title: "Benzodiazepine chapter",
    paragraphs: [
      "Benzodiazepines and their unregulated relatives deepen sedation and weaken memory and protective reflexes. A person can be awake enough to talk and still be unsafe to walk, drive, or look after a child. Blackouts are part of the effect, not a rare surprise.",
      "With an opioid or alcohol they are a common cause of fatal overdose. Naloxone reverses only an opioid that is also present. It does not wake someone from the benzodiazepine. Flumazenil is a hospital reversal agent. It can trigger seizures and it is not a home antidote. This file does not describe how to use it.",
      "Some tablets sold as a familiar benzodiazepine are a different, stronger chemical. Onset can be slow. A slow start is not a reason to take more. Dependence builds with repeated use, and stopping a long course suddenly can cause seizure. A prescribed course is stopped with the prescriber.",
      "This file has no dose. It does not say a benzodiazepine makes an opioid, alcohol, or another sedative safe.",
    ],
  },
  psychedelic: {
    id: "psychedelic",
    title: "Psychedelic chapter",
    paragraphs: [
      "Psychedelics change perception, thinking, and the sense of self. Time, body size, and meaning can distort. The physiological risk depends on the chemical. LSD-type drugs are less likely to stop breathing than an opioid. MDMA is a stimulant as well as a psychedelic and overheats people. NBOMe compounds, DOB-type drugs, and some plants are physiologically harsh and can cause seizure, a dangerous heart rhythm, or vasoconstriction.",
      "Panic, paranoia, and a sense of dying are common psychological emergencies. A calm, sober person in a quiet, familiar place reduces that risk. It does not remove a heart problem, a seizure, or a misidentified substance. Chest pain, a seizure, or a person who cannot be cooled is an emergency, not a challenging experience to sit with.",
      "Lithium plus an LSD-type psychedelic has been associated with seizures. Antidepressants, especially MAOIs, change the risk of serotonergic drugs and some psychedelics. Cannabis can intensify fear. A second psychedelic stacks confusion. This file has no dose and does not describe extraction or preparation of plants or fungi.",
      "Effects can return briefly days later as a flash of perception. Persistent distress after the drug has worn off is a health problem, not a badge. This archive does not tell anyone to take a psychedelic.",
    ],
  },
  dissociative: {
    id: "dissociative",
    title: "Dissociative chapter",
    paragraphs: [
      "Dissociatives such as ketamine, PCP-type drugs, and methoxetamine disconnect perception from the body. People fall, choke, or lie still in a pool of vomit. The airway matters more than the visions. A person who cannot sit up needs a sober watcher and, if breathing slows, emergency services.",
      "Ketamine irritates the bladder. Repeated use causes pain, blood, and scarring that can become permanent. That harm is not avoided by a clear reagent colour. PCP-type drugs add agitation, high blood pressure, and a dangerous body temperature. Combining a dissociative with alcohol, GHB, or an opioid deepens the loss of airway protection.",
      "A K-hole or equivalent immobilising state is overdose of function even when the heart is still beating. Do not leave the person in a bath, a road, or face-down in bedding. This file has no dose and no preparation.",
    ],
  },
  cannabinoid: {
    id: "cannabinoid",
    title: "Cannabinoid chapter",
    paragraphs: [
      "THC and related plant cannabinoids alter attention, memory, heart rate, and anxiety. The plant is not one drug. THC, CBD, and the rest of the mixture vary by sample. Edible products start later than smoked or vaped ones. A late start is a common reason people take more and then panic. This file has no dose.",
      "Synthetic cannabinoids sold as incense, spice, or a similar name are a different and harsher group. They have caused seizures, kidney injury, vomiting that will not stop, and collapse. A package that looks like cannabis is not evidence of what is inside.",
      "Cannabis adds sedation. With alcohol the impairment is worse than either alone. With an opioid it adds to the sedation. Do not drive. Panic and a racing heart from THC are usually self-limited, but chest pain is still an emergency. Psychosis and heavy vomiting syndromes happen in some people and are reasons to stop, not to add another drug.",
      "CBD can change the level of other medicines. A shop oil is not a calibrated product. This archive does not sell or recommend cannabis.",
    ],
  },
  antidepressant: {
    id: "antidepressant",
    title: "Antidepressant chapter",
    paragraphs: [
      "Antidepressants are a mixed class. SSRIs and SNRIs raise serotonin and can take weeks to change mood. Tricyclics are dangerous in overdose because they poison the heart. MAOIs can cause a blood-pressure crisis with stimulants and serotonin syndrome with serotonergic drugs. Bupropion raises seizure risk. They are not interchangeable because they share a label.",
      "Serotonin syndrome is agitation, sweating, tremor, rigid muscles, and a rising temperature. With an MAOI it is an emergency. Stopping an SSRI or SNRI suddenly can cause dizziness, electric-shock sensations, and insomnia. A prescribed course is changed with the prescriber. This file is not a regimen.",
      "Bleeding rises with SSRIs plus NSAIDs or anticoagulants. Alcohol adds sedation and poor decisions. These medicines do not make MDMA, tramadol, or a second antidepressant safe. This file has no dose.",
    ],
  },
  antipsychotic: {
    id: "antipsychotic",
    title: "Antipsychotic chapter",
    paragraphs: [
      "Antipsychotics sedate, can drop blood pressure, and for several of them prolong the QT interval of the heart. Clozapine adds a rare but serious fall in white blood cells that is monitored in medical care. Metabolic changes such as weight gain and high blood sugar arrive with longer use of several drugs in the class.",
      "A faint, a seizure, a very high temperature with rigid muscles, or a person who will not wake needs emergency care. Neuroleptic malignant syndrome is that hot, rigid, confused picture. It is not ordinary stiffness. Other sedatives deepen the impairment. This file is not a reason to start, stop, or swap an antipsychotic, and it has no dose.",
    ],
  },
  anaesthetic: {
    id: "anaesthetic",
    title: "Anaesthetic chapter",
    paragraphs: [
      "Anaesthetics exist to remove consciousness, pain, or local sensation under monitoring. Outside that setting they stop breathing, collapse the circulation, or both. Ketamine is also filed with dissociatives. Local anaesthetics such as lidocaine and benzocaine, especially in the mouth or in a large exposure, can cause seizures and a blood disorder that turns people blue.",
      "A blue colour without a good explanation, a seizure, or stopped breathing is an emergency. Combining an anaesthetic with alcohol or an opioid removes the remaining airway protection. This archive does not describe anaesthetic technique, amounts, or how to obtain these drugs.",
    ],
  },
  inhalant: {
    id: "inhalant",
    title: "Inhalant chapter",
    paragraphs: [
      "Inhalants are not one chemical. Solvents, fuels, and propellants sensitise the heart. A sudden fright, exercise, or another stimulant can trigger a fatal rhythm even in a young person. Nitrites, sometimes called poppers, are a different group. They drop blood pressure and, with a PDE5 inhibitor such as sildenafil, that drop can kill. Nitrous oxide is another pattern again: it displaces oxygen and, with repeated use, inactivates vitamin B12 and damages nerves.",
      "The dangerous moment is often during or just after inhalation. Do not chase someone who is startled, and do not add a stimulant to wake them. Loss of consciousness, a seizure, chest pain, or a person who stays numb or unsteady for days needs emergency care. This file does not describe a method of inhalation.",
      "A pair with no stored rule is still treated as dangerous. Sudden heart death does not wait for a named interaction.",
    ],
  },
  plant_fungi: {
    id: "plant_fungi",
    title: "Plant and fungus chapter",
    paragraphs: [
      "Plants and fungi in this index are identification and poisoning records. Strength changes with the specimen, the season, and the part of the organism. Two mushrooms that look alike can be a meal and a liver failure. Amanita phalloides, Galerina, and death cap relatives destroy the liver after a delay of many hours, so early vomiting is not the end of the illness.",
      "Datura and brugmansia cause a hot, dry, delirious poisoning with a racing heart. They are not a psychedelic to sit with. Yew contains taxine and can stop the heart. Castor bean and rosary pea are poisoning warnings. This archive does not describe extraction, preparation, or an amount of any plant toxin, including ricin or abrin.",
      "If someone has eaten a wild mushroom or an unknown plant and then vomits, hallucinates, or collapses, contact emergency services and, where one exists, a poison centre. A photo of the specimen helps the clinicians. A clear reagent test does not identify a mushroom.",
    ],
  },
  research_chemical: {
    id: "research_chemical",
    title: "Research-chemical chapter",
    paragraphs: [
      "Research chemicals are sold under a chemical name or a code. The bag is often a different substance, a mixture, or a more potent analogue. Toxicity data are thin because the exposure history is short. Treating them as a familiar drug from the same family is how people overdose.",
      "Stimulant-like chemicals overheat and strain the heart. Opioid-like chemicals, including nitazenes and fentanyl analogues, stop breathing and may outlast a single naloxone dose. Benzodiazepine analogues cause blackouts at exposures people did not expect. Psychedelic analogues can cause seizures or prolonged vasoconstriction.",
      "A pair with no stored rule is still treated as dangerous. A reagent colour is not an identity and not a strength. This file has no dose, no source, and no synthesis.",
    ],
  },
  prescription: {
    id: "prescription",
    title: "Prescription chapter",
    paragraphs: [
      "Many files in this class are ordinary medicines. They are in the archive because they change bleeding, sedation, heart rhythm, potassium, blood sugar, or the level of another drug. A licensed status is not a low risk when the mix is wrong.",
      "Read the known-mix list on the file before assuming a blank search means the pair is fine. Antibiotics raise some statins, anticoagulants, and seizure medicines. Enzyme inducers such as rifampicin, carbamazepine, phenytoin, and St John's wort drop the level of contraceptives and some anticoagulants. NSAIDs add bleeding and kidney injury.",
      "This file is not a prescribing guide and not a regimen. Stopping a heart medicine, a steroid course, or an antidepressant because an archive said the drug has risks can itself cause harm. Changes belong with the prescriber. Emergency signs still apply: chest pain, fainting, bleeding that will not stop, a spreading blistering rash, or a person who will not wake.",
    ],
  },
  otc: {
    id: "otc",
    title: "Over-the-counter chapter",
    paragraphs: [
      "Sold without a prescription does not mean mild. Paracetamol overdose destroys the liver, and the early hours can feel like a stomach upset. The antidote is time-critical. Aspirin and other NSAIDs cause stomach bleeding and, in large exposure, ringing ears and a dangerous acid-base change. Sedating antihistamines cause delirium and, with alcohol or an opioid, blackouts while the opioid still stops breathing.",
      "Dextromethorphan is serotonergic and dissociative at high exposure. With an MAOI it is dangerous. Combination cold products hide a second dose of paracetamol or an antihistamine. Read the second ingredient. This file has no dose and does not describe how to take more.",
      "Liver pain is a late sign. If a large amount of paracetamol might have been taken, emergency care is the move even when the person feels well.",
    ],
  },
  withdrawn: {
    id: "withdrawn",
    title: "Withdrawn-drug chapter",
    paragraphs: [
      "These substances left major markets because they injured an organ, or they are toxic contaminants people did not mean to take. Phenformin caused lactic acidosis. Some appetite drugs injured heart valves. Diethylene glycol and similar solvents have been substituted into medicines and caused kidney failure.",
      "A pair with no stored rule is still treated as dangerous. An old bottle, a imported powder, or a product from before a withdrawal is not made safe by age. This file has no dose and no method of preparation.",
    ],
  },
  historical: {
    id: "historical",
    title: "Historical chapter",
    paragraphs: [
      "Historical files cover old medicines and poisons that still injure people when a bottle, a plant, or a recreation shows up. The chemistry did not expire when the fashion did. Mercury, arsenic, and chloroform are still toxic. Strength on an old label is not a measurement you can trust.",
      "This archive records the harm so it can be recognised. It does not describe how to recreate a preparation. If someone has swallowed an old medicine or a chemical from a workshop, contact emergency services or a poison centre and bring the container.",
    ],
  },
  other: {
    id: "other",
    title: "Other-substances chapter",
    paragraphs: [
      "This class holds substances that do not sit cleanly in one intoxicant group, including many toxic alcohols and chemicals people meet by accident. Methanol, ethylene glycol, and isopropanol cause a different poisoning from drinking alcohol. Methanol and ethylene glycol injure vision, the brain, and the kidneys after a delay. Feeling a little drunk is not reassurance.",
      "A moderate floor on a mix means both substances still act in the same hour. It is not a clearance. Breathing trouble, blindness, severe vomiting, chest pain, or a person who will not wake is an emergency regardless of the class label.",
      "Where this file is thin, the thinness is the gap in the record. It is not evidence that the substance is gentle. This archive does not provide an amount, a preparation, or a source.",
    ],
  },
};

const GROUPS: Record<string, Chapter> = {
  nsaid: {
    id: "nsaid",
    title: "NSAID chapter",
    paragraphs: [
      "NSAIDs inhibit cyclo-oxygenase and lower prostaglandins. Pain and inflammation fall. The stomach lining and kidney blood flow lose protection. Bleeding ulcers, kidney injury, and higher blood pressure are the harms, and they happen in people who felt fine the week before.",
      "A second NSAID, including aspirin hidden in a cold product, stacks the bleeding. Alcohol and a corticosteroid add stomach injury. With an ACE inhibitor or an ARB plus a diuretic, the kidneys can fail, especially if the person is dehydrated. Anticoagulants and SSRIs add bleeding. Later pregnancy is a specific danger for this class. This file is not a pain regimen and has no dose.",
    ],
  },
  "beta-blocker": {
    id: "beta-blocker",
    title: "Beta-blocker chapter",
    paragraphs: [
      "Beta blockers slow the heart and lower blood pressure. They can hide the warning signs of low blood sugar and can tighten airways in someone with asthma. Stopping a long course suddenly can bring a surge of heart strain.",
      "They do not make cocaine or another stimulant safe. With a dihydropyridine calcium-channel blocker or alcohol, blood pressure can fall hard. A wheeze, a faint, or a very slow pulse is an emergency. This file has no dose.",
    ],
  },
  qt: {
    id: "qt",
    title: "QT chapter",
    paragraphs: [
      "Drugs in this group can prolong the QT interval on a heart tracing. The feared result is a twisting rhythm that causes fainting or sudden death. Low potassium, low magnesium, a slow heart, and a second QT drug raise that chance.",
      "Diarrhoea, diuretics, and poor intake drop potassium. Adding methadone, ondansetron, a macrolide, a fluoroquinolone, citalopram, or another listed QT drug is not a neutral combination. Fainting or a racing irregular heart needs emergency care. This file has no dose.",
    ],
  },
  diuretic: {
    id: "diuretic",
    title: "Diuretic chapter",
    paragraphs: [
      "Diuretics increase urine and shift sodium, water, and often potassium. Blood pressure falls. People collapse on standing, especially in heat or with alcohol. Potassium can go too low, which provokes heart rhythms, or too high with the potassium-sparing members.",
      "An NSAID plus an ACE inhibitor or ARB plus a diuretic is a known kidney-injury pattern. This file does not say how much water or salt to take, and it is not a blood-pressure regimen.",
    ],
  },
  penicillin: {
    id: "penicillin",
    title: "Penicillin chapter",
    paragraphs: [
      "Penicillins are beta-lactam antibiotics. They are not intoxicants. The emergency in this class is allergy: a spreading rash, swelling of the mouth or tongue, wheeze, or collapse. That is anaphylaxis and needs emergency services.",
      "A previous severe penicillin reaction is a reason not to take another member casually. Diarrhoea and rash are common and still worth telling a clinician. This file is not an antibiotic regimen.",
    ],
  },
  "beta-agonist": {
    id: "beta-agonist",
    title: "Beta-agonist chapter",
    paragraphs: [
      "Beta agonists open airways in medical use. Heart rate rises, hands shake, and potassium can fall. Another stimulant, or excessive repeated inhalation during an asthma attack that is not responding, adds heart strain.",
      "Chest pain or a very fast heart needs emergency care. An asthma attack that is worsening is itself an emergency. This file has no dose and does not replace an asthma plan.",
    ],
  },
  acei: {
    id: "acei",
    title: "ACE-inhibitor chapter",
    paragraphs: [
      "ACE inhibitors lower blood pressure and can raise potassium. A dry cough is common. Swelling of the face, lips, or tongue can be angioedema, which closes the airway and is an emergency even when the person can still talk.",
      "Kidneys fail more easily with an NSAID plus a diuretic, and when the person is dehydrated. Pregnancy is a contraindication. Potassium supplements and potassium-sparing diuretics push potassium toward a heart rhythm problem. This file is not a blood-pressure regimen.",
    ],
  },
  fluoroquinolone: {
    id: "fluoroquinolone",
    title: "Fluoroquinolone chapter",
    paragraphs: [
      "Fluoroquinolone antibiotics can injure tendons, confuse older people, and, for several members, prolong the QT interval. A corticosteroid in the same period raises the chance of tendon rupture. Sudden tendon pain is a reason to stop and get care, not to stretch through it.",
      "They also raise theophylline and, for some, the effect of other drugs. Fainting, a seizure, or a snapping pain in a tendon needs urgent care. This file is not an antibiotic regimen.",
    ],
  },
  "sedating-antihistamine": {
    id: "sedating-antihistamine",
    title: "Sedating-antihistamine chapter",
    paragraphs: [
      "Sedating antihistamines block histamine and often acetylcholine. People become drowsy, dry, and confused. The impairment lasts into the next day. With alcohol or an opioid the blackout is deeper, and the opioid can still stop breathing.",
      "High exposure causes delirium, a fast heart, and sometimes seizures. Diphenhydramine is a common hidden ingredient in sleep and allergy products, so two bottles can be the same drug twice. Older adults are more likely to become confused. This file has no dose.",
    ],
  },
  arb: {
    id: "arb",
    title: "ARB chapter",
    paragraphs: [
      "ARBs lower blood pressure by blocking angiotensin receptors. Potassium can rise. The kidney risk with an NSAID and a diuretic matches the ACE-inhibitor pattern. Pregnancy is a contraindication.",
      "Dizziness and collapse get worse with alcohol and other pressure-lowering drugs. This file is not a regimen and has no dose.",
    ],
  },
  serotonin: {
    id: "serotonin",
    title: "Serotonin chapter",
    paragraphs: [
      "This group raises serotonin signalling. The members are not the same drug. MDMA is also a stimulant that overheats people. Tramadol is also an opioid that slows breathing. DXM is in cough syrup. Antidepressants and St John's wort sit here too.",
      "Together, or with an MAOI, they can produce serotonin syndrome: agitation, sweating, tremor, rigid muscles, and a climbing temperature. That is an emergency. A cool room does not treat rigidity and a high temperature from this mix. This file has no dose.",
    ],
  },
  dihydropyridine: {
    id: "dihydropyridine",
    title: "Dihydropyridine chapter",
    paragraphs: [
      "Dihydropyridine calcium-channel blockers widen blood vessels. Blood pressure falls, ankles swell, and the face flushes. With alcohol, a beta blocker, or another pressure-lowering medicine the drop can be a collapse.",
      "Chest pain that is new is still an emergency. This file does not describe a blood-pressure regimen.",
    ],
  },
  azole: {
    id: "azole",
    title: "Azole chapter",
    paragraphs: [
      "Azole antifungals treat fungal infection in medical use. Several of them block liver enzymes and raise the level of other drugs: some statins, some sedatives, and some heart medicines. The person feels the other drug, not the antifungal.",
      "Severe muscle pain and dark urine can be muscle breakdown from a risen statin. Jaundice is a liver warning. This file is not a reason to combine an azole with a statin, and it is not a regimen. A blanket claim that every statin plus every azole is deadly is not what the stored rules say. The specific pair note wins.",
    ],
  },
  sulfonamide: {
    id: "sulfonamide",
    title: "Sulfonamide chapter",
    paragraphs: [
      "Sulfonamides are associated with allergy, including rare severe skin reactions. A rash that spreads, blisters, or peels, or sores in the mouth and eyes, needs urgent care. That picture can be Stevens-Johnson syndrome.",
      "The kidney can also be irritated, and some members affect other drugs' levels. A previous severe sulfa reaction matters. This file is not an antibiotic regimen.",
    ],
  },
  "contraceptive-hormone": {
    id: "contraceptive-hormone",
    title: "Hormonal-contraceptive chapter",
    paragraphs: [
      "Hormonal contraceptives fail when enzyme-inducing drugs lower their level. Rifampicin, some seizure medicines, and St John's wort are the usual names. A missed or weakened contraceptive is a pregnancy risk, not a mood side effect.",
      "Chest pain, sudden breathlessness, one-sided leg swelling, or a sudden one-sided weakness can be a clot or a stroke. Those signs need emergency care. This file is not a contraceptive regimen and has no dose.",
    ],
  },
  nitrate: {
    id: "nitrate",
    title: "Nitrate chapter",
    paragraphs: [
      "Nitrates release nitric oxide and widen blood vessels. They are heart medicines. With a PDE5 inhibitor such as sildenafil, tadalafil, vardenafil, or avanafil, blood pressure can collapse. That mix is deadly. Alkyl nitrites, called poppers, do the same kind of harm with a PDE5 inhibitor.",
      "A pounding headache and flushing can be the nitrate alone. Fainting, chest pain, or a person who cannot stand is an emergency. This file has no dose and does not say how long to wait between a nitrate and a PDE5 inhibitor. That interval is a prescriber's instruction, not a guess from an archive.",
    ],
  },
  corticosteroid: {
    id: "corticosteroid",
    title: "Corticosteroid chapter",
    paragraphs: [
      "Corticosteroids reduce inflammation. Longer exposure raises blood sugar, thins skin, and weakens bone and tissue. With an NSAID the stomach bleeds more easily. With a fluoroquinolone the tendon risk rises.",
      "Stopping a long course suddenly can itself cause collapse and low blood pressure. This file is not a steroid regimen and has no dose. It does not describe a taper.",
    ],
  },
  maoi: {
    id: "maoi",
    title: "MAOI chapter",
    paragraphs: [
      "Monoamine oxidase inhibitors include some antidepressants and some plant preparations such as Syrian rue, Banisteriopsis caapi, and ayahuasca. They also include linezolid and methylene blue in medical use. The enzyme they block normally clears serotonin, noradrenaline, and related amines.",
      "A stimulant, including cocaine and amphetamines, can cause a blood-pressure crisis: severe headache, chest pain, and a very high pressure. A serotonergic drug, including an SSRI, an SNRI, tramadol, DXM, or MDMA, can cause serotonin syndrome. Both are emergencies. The danger can outlast the last dose of the MAOI by days. This file has no dose and does not describe a brew or a diet plan.",
    ],
  },
  tca: {
    id: "tca",
    title: "Tricyclic chapter",
    paragraphs: [
      "Tricyclic antidepressants overdose by blocking sodium channels in the heart and by anticholinergic toxicity. The picture is a fast wide heart rhythm, seizures, dry hot skin, and coma. It is not a wait-and-see overdose. Emergency care is the whole response.",
      "With an MAOI the serotonin risk is severe. Other sedatives deepen the impairment. This file has no dose. A prescribed course is not stopped from an archive page.",
    ],
  },
  "combined-contraceptive": {
    id: "combined-contraceptive",
    title: "Combined-contraceptive chapter",
    paragraphs: [
      "Combined contraceptives contain an estrogen and a progestin. Clot risk is higher in some people, including smokers over 35 in the licensed warnings and people with migraine with aura. Enzyme inducers can make the contraceptive fail.",
      "Sudden breathlessness, chest pain, one-sided leg swelling, or sudden neurological symptoms need emergency care. This file is not a regimen.",
    ],
  },
  "disulfiram-like": {
    id: "disulfiram-like",
    title: "Disulfiram-like chapter",
    paragraphs: [
      "These medicines make alcohol's breakdown toxic, by blocking aldehyde dehydrogenase or a related step. Alcohol, including alcohol in mouthwash, cough syrup, or a sauce, can cause flushing, vomiting, a pounding heart, and collapse.",
      "The reaction can happen while the medicine is still in the body, which is longer than the day it was swallowed. This file has no dose and does not describe a detoxification schedule.",
    ],
  },
  xanthine: {
    id: "xanthine",
    title: "Xanthine chapter",
    paragraphs: [
      "Xanthines include caffeine and theophylline. They alert or open airways, and at a high level they cause vomiting, a racing heart, and seizures. Theophylline has a narrow margin. Ciprofloxacin and some other drugs raise it into toxicity.",
      "Stacking caffeine pills, energy drinks, and a stimulant is still one stimulant load. A seizure or chest pain is an emergency. Powdered caffeine is easy to overshoot because the powder is not a drink. This file has no dose.",
    ],
  },
  sulfonylurea: {
    id: "sulfonylurea",
    title: "Sulfonylurea chapter",
    paragraphs: [
      "Sulfonylureas push the pancreas to release insulin. Blood sugar can fall dangerously low, especially if the person has not eaten or has also taken alcohol or another glucose-lowering drug. Sweating, confusion, and unconsciousness are the picture.",
      "Low blood sugar is an emergency when the person cannot swallow safely. This file is not a diabetes regimen and has no dose.",
    ],
  },
  statin: {
    id: "statin",
    title: "Statin chapter",
    paragraphs: [
      "Statins lower cholesterol production. The serious interaction harm is muscle breakdown when another drug raises the statin level. Clarithromycin and erythromycin are stored as dangerous with statins. Severe muscle pain, weakness, and dark urine need urgent care because the released muscle protein injures kidneys.",
      "Not every cholesterol drug is a statin. Nystatin, cilastatin, pentostatin, and somatostatin are different chemicals that only share a syllable. Pravastatin and rosuvastatin depend less on the enzyme that clarithromycin blocks, and the risk is not identical across the class. This file is not a lipid regimen. A stored rule's own note is the pair answer.",
    ],
  },
  "cardiac-glycoside": {
    id: "cardiac-glycoside",
    title: "Cardiac-glycoside chapter",
    paragraphs: [
      "Cardiac glycosides such as digoxin increase the force of the heartbeat and can slow the rate. The margin between the medical effect and toxicity is narrow. Nausea, visual halos, confusion, and an irregular heart are toxicity until proved otherwise.",
      "Clarithromycin, amiodarone, and verapamil raise the level. Low potassium makes toxicity more likely. This file has no dose and is not a heart regimen.",
    ],
  },
  doac: {
    id: "doac",
    title: "Direct-oral-anticoagulant chapter",
    paragraphs: [
      "Direct oral anticoagulants reduce clotting. Bleeding is the harm: nosebleeds that will not stop, black stools, vomiting blood, or a sudden severe headache. If an enzyme inducer drops the level, clot risk returns instead. Rifampicin, carbamazepine, phenytoin, and St John's wort are stored as dangerous with this group for that reason.",
      "Another anticoagulant or an NSAID adds bleeding. This file is not a clot regimen and has no dose.",
    ],
  },
  ssri: {
    id: "ssri",
    title: "SSRI chapter",
    paragraphs: [
      "SSRIs raise serotonin. Mood may change over weeks, not hours. With another serotonergic drug or an MAOI the result can be serotonin syndrome. With an NSAID or an anticoagulant, bleeding rises. Sexual dysfunction, nausea, and a rough discontinuation syndrome are common.",
      "Fluoxetine lasts a long time, so a new serotonergic drug after stopping it can still meet it. This file is not a depression regimen and has no dose. Do not stop it suddenly from an archive page.",
    ],
  },
  triptan: {
    id: "triptan",
    title: "Triptan chapter",
    paragraphs: [
      "Triptans are serotonin 1B/1D agonists used for migraine. Blood vessels constrict. Chest tightness happens and is often benign, but true chest pain is still an emergency. With an ergot the spasm can be prolonged. With an MAOI the mix is contraindicated.",
      "This file is not a migraine regimen and has no dose. It does not say a triptan is safe with an antidepressant. The pair note is the answer.",
    ],
  },
  heparin: {
    id: "heparin",
    title: "Heparin chapter",
    paragraphs: [
      "Heparins reduce clotting in care settings. Bleeding is the harm. Some people lose platelets and then clot paradoxically. That is a reason for hospital monitoring, not a home adjustment.",
      "This file is not a protocol and has no amount. Bleeding that will not stop, or a new painful swollen limb, needs urgent care.",
    ],
  },
  vka: {
    id: "vka",
    title: "Vitamin K antagonist chapter",
    paragraphs: [
      "Vitamin K antagonists such as warfarin reduce clotting over days. Many other drugs swing the effect up or down. Antibiotics, NSAIDs, alcohol binges, and enzyme inducers are the everyday surprises. Bleeding, black stools, and a sudden severe headache are emergencies.",
      "This is not an opioid reversal agent and not a reason to take vitamin K as a hobby. A high or low clotting test is a clinician's problem. This file has no dose.",
    ],
  },
  pde5: {
    id: "pde5",
    title: "PDE5-inhibitor chapter",
    paragraphs: [
      "PDE5 inhibitors widen blood vessels. With a nitrate heart medicine or an alkyl nitrite they can collapse blood pressure. That mix is deadly. Alpha blockers can drop the pressure sharply as well. A painful erection that will not end needs emergency care because the tissue is starved of oxygen.",
      "Chest pain in someone who has taken a PDE5 inhibitor changes which heart medicines are safe. Tell the emergency clinicians. This file has no dose.",
    ],
  },
  "alpha-blocker": {
    id: "alpha-blocker",
    title: "Alpha-blocker chapter",
    paragraphs: [
      "Alpha blockers lower blood pressure by widening vessels. The first doses, and any dose taken with a PDE5 inhibitor or alcohol, can cause a collapse on standing. The heart may race in response.",
      "Standing up slowly is not a treatment for a faint that includes chest pain. This file has no dose.",
    ],
  },
  nitrite: {
    id: "nitrite",
    title: "Nitrite chapter",
    paragraphs: [
      "Alkyl nitrites drop blood pressure for a short time. With a PDE5 inhibitor the drop can be fatal. Some products have caused a blood disorder that leaves people blue and breathless. A blue colour, chest pain, or fainting is an emergency.",
      "They are not a harmless club accessory and they are not the same chemical as amyl nitrite from a pharmacy history. This file does not describe use.",
    ],
  },
  "potassium-sparing": {
    id: "potassium-sparing",
    title: "Potassium-sparing chapter",
    paragraphs: [
      "Potassium-sparing diuretics hold potassium in the blood. With an ACE inhibitor, an ARB, a potassium supplement, or trimethoprim, potassium can rise high enough to stop the heart. Weakness and a slow irregular pulse are the outward signs.",
      "Spironolactone also has hormonal effects. This file is not a blood-pressure or acne regimen.",
    ],
  },
  "potassium-supplement": {
    id: "potassium-supplement",
    title: "Potassium-supplement chapter",
    paragraphs: [
      "Potassium salts are dangerous when the kidneys cannot clear them or another drug is holding potassium. The level stops the heart before the person feels a clear warning. Numbness, weakness, and paralysis are late signs.",
      "ACE inhibitors, ARBs, and potassium-sparing diuretics are the mixes to respect. This file has no amount. Salt substitutes can be potassium too.",
    ],
  },
  snri: {
    id: "snri",
    title: "SNRI chapter",
    paragraphs: [
      "SNRIs inhibit reuptake of serotonin and noradrenaline. Blood pressure can rise. Serotonin syndrome is the mix risk with MAOIs and other serotonergic drugs. Stopping suddenly causes dizziness and a flu-like feeling.",
      "This file is not a depression regimen. A prescribed course is changed with the prescriber.",
    ],
  },
  "pethidine-product": {
    id: "pethidine-product",
    title: "Pethidine chapter",
    paragraphs: [
      "Pethidine, also called meperidine, is an opioid. It slows breathing like other opioids, and a metabolite can cause seizures when it accumulates. With an MAOI the mix is particularly hazardous and is stored as deadly where the rules say so.",
      "Benzodiazepines and alcohol add stopped breathing. This file has no dose. Naloxone reverses only the opioid part and can wear off first.",
    ],
  },
  "xanthine-oxidase": {
    id: "xanthine-oxidase",
    title: "Xanthine-oxidase chapter",
    paragraphs: [
      "Xanthine-oxidase inhibitors lower uric acid. Allopurinol and febuxostat can raise azathioprine and mercaptopurine into bone-marrow toxicity. Fever, mouth ulcers, and bleeding are the late signs of that rise. The stored pair with azathioprine is deadly.",
      "This file is not a gout regimen and has no dose.",
    ],
  },
  "bleed-herb": {
    id: "bleed-herb",
    title: "Bleeding-plant chapter",
    paragraphs: [
      "These plants are associated with extra bleeding. The evidence is uneven from plant to plant, and the risk still matters next to warfarin, another anticoagulant, or an NSAID. A bruise that spreads or a nosebleed that will not stop is a reason for care.",
      "This file has no preparation and does not describe how to make a tea, an extract, or a dose.",
    ],
  },
  "statin-like": {
    id: "statin-like",
    title: "Statin-like chapter",
    paragraphs: [
      "Statin-like lipid drugs share the muscle-breakdown harm when another medicine raises their level. Severe muscle pain and dark urine need urgent care.",
      "This file is not a lipid regimen. The pair note, not the similar name, decides the severity.",
    ],
  },
};

export function readingFor(category: string, groups: string[]): Chapter[] {
  const chapters: Chapter[] = [];
  const main = CLASSES[category];
  if (main) chapters.push(main);
  for (const key of groups) {
    const chapter = GROUPS[key];
    if (chapter) chapters.push(chapter);
  }
  return chapters;
}
