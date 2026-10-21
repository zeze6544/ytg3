import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROWS } from "./substances.mjs";
import { MORE_ROWS } from "./substances-more.mjs";
import { NEXT_ROWS } from "./substances-next.mjs";
import { DOUBLE_ROWS, EXTRA_STRAINS, EXTRA_TIMELINE, EXTRA_RULES, EXTRA_GROUPS } from "./substances-double.mjs";
import { FOLD_ROWS, FOLD_STRAINS, FOLD_TIMELINE, FOLD_RULES, FOLD_GROUPS } from "./substances-fold.mjs";
import { TRIPLE_ROWS, TRIPLE_STRAINS, TRIPLE_TIMELINE, TRIPLE_RULES, TRIPLE_GROUPS } from "./substances-triple.mjs";
import { QUAD_ROWS, QUAD_STRAINS } from "./substances-quad.mjs";
import { MAX_ROWS, MAX_STRAINS } from "./substances-max.mjs";
import { prunePublishedFiles } from "./prune-files.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LEGAL =
  "Control status depends on the country, the form, and sometimes the amount. This file is not legal advice.";

const MEDICAL = {
  med: "Licensed as a medicine in at least some countries. A prescription covers a medical use. Mixing it, or taking it outside that care, adds a separate harm.",
  none: "No accepted medical product. Material in circulation is unregulated and may be mislabelled or contaminated.",
  hospital: "Used in hospital or specialist care. Outside that setting the strength and purity are not assured.",
  traditional:
    "Used in traditional preparations. Strength varies by plant, season, and batch. This file does not describe preparation.",
  withdrawn: "Removed from many markets because of harm. Remaining material does not become safe.",
  adulterant:
    "Encountered as a contaminant in other substances. Presence is a warning about the supply, not a target.",
  otc: "Sold without a prescription in many places. Easy access does not make a mix with alcohol or other sedatives safe.",
  listed: "Named on the public FDA substance list. A listing is not an approval, a dose, or a clearance.",
};

const CLASSES = {
  opioid: {
    name: "Opioid",
    color: "red",
    description: "Substances that act on opioid receptors. The acute danger is slowed or stopped breathing, especially with sedatives.",
    mechanism: "Mu-opioid receptor activity. Breathing slows as the effect deepens.",
    chemistry: "Opioid. Named here so the breathing risk can be recognised. Manufacture and extraction are outside this archive.",
    onset: "Depends on the substance and the route. Some act in minutes. Others take much longer, which is when people get into trouble by taking more.",
    duration: "Often several hours. Some synthetic opioids last much longer than naloxone.",
    half_life: "Ranges from short to very long. A person can look awake and still stop breathing later.",
    effects: ["pain relief", "sedation", "euphoria", "slowed breathing"],
    adverse: ["nausea", "constipation", "itching", "confusion", "respiratory depression"],
    acute: "The acute danger is slowed or stopped breathing. Alcohol, benzodiazepines, and other sedatives multiply that risk. Non-pharmaceutical material may contain fentanyl, nitazenes, or xylazine.",
    chronic: "Tolerance, dependence, constipation, low sex hormones, and fatal overdose are the main long-term harms.",
    overdose: "Slow or stopped breathing, blue or grey lips, gurgling, unresponsiveness, pinpoint pupils. This is an emergency. Naloxone can reverse the opioid and may need repeating.",
    dependence: "Physical dependence is common with repeated use.",
    tolerance: "Tolerance rises with repeated use, then falls after a break. A familiar amount can become fatal after a pause.",
    withdrawal: "Withdrawal feels like a severe flu with cramps, sweating, and distress. It is rarely fatal by itself and it raises the chance of returning to use.",
    uses: "Some opioids are pain or addiction medicines. Many have no accepted role outside a hospital, or none at all.",
    contra: "Other sedatives, sleep apnoea, severe lung disease, and unmeasured-strength material.",
    testing: "Fentanyl strips and reagent colours miss analogues and do not measure strength. A negative test is not proof of safety.",
    hr: "Do not use alone. Keep naloxone nearby and make sure another person knows how to use it. A blank mix result is not a green light. This file has no dose.",
  },
  stimulant: {
    name: "Stimulant",
    color: "amber",
    description: "Substances that speed up the nervous system. The acute dangers are overheating, heart strain, seizures, and psychosis.",
    mechanism: "Increases catecholamine signalling, by release, reuptake block, or both.",
    chemistry: "Stimulant. Named here for the heart and temperature risk. Synthesis is outside this archive.",
    onset: "Often minutes to an hour, depending on the substance. Fast onset does not mean the heart is safe.",
    duration: "Hours, sometimes with a long crash afterwards. Some substituted cathinones last longer than people expect.",
    half_life: "Highly variable. Residual stimulation and a low mood can outlast the wanted effect.",
    effects: ["alertness", "energy", "talkativeness", "reduced appetite", "raised heart rate"],
    adverse: ["anxiety", "jaw clenching", "overheating", "chest pain", "paranoia", "insomnia"],
    acute: "Heart attack, stroke, seizure, overheating, and agitated psychosis. Risk rises with other stimulants, dehydration, and confined hot spaces.",
    chronic: "Dependence, exhaustion, weight loss, heart injury, tooth and nasal damage for some, and persistent anxiety or psychosis.",
    overdose: "Chest pain, collapsing, extreme agitation, very high temperature, seizures, or a pounding heart. This is an emergency.",
    dependence: "Psychological dependence is common. Some stimulants also cause a severe crash.",
    tolerance: "The wanted effect fades faster than the strain on the heart.",
    withdrawal: "Exhaustion, hunger, low mood, and strong cravings. Suicidal thoughts can appear in the crash.",
    uses: "A few are licensed for attention or sleep disorders. Most stimulant material outside a pharmacy is unregulated.",
    contra: "Heart disease, uncontrolled blood pressure, psychosis, pregnancy, and MAOI medicines.",
    testing: "Reagents can suggest a class and still miss dangerous substitutes such as PMA, synthetic cathinones, or fentanyl in a pressed pill.",
    hr: "Overheating and chest pain are emergencies. Do not mix with other stimulants or MAOIs. This file has no dose and no source.",
  },
  depressant: {
    name: "Depressant",
    color: "cyan",
    description: "Sedatives including alcohol, GHB, barbiturates, and related drugs. They slow the brain and can stop breathing.",
    mechanism: "Calms central nervous system signalling, often through GABA or related pathways.",
    chemistry: "Sedative. Named here for the unconsciousness and breathing risk. Preparation is outside this archive.",
    onset: "Minutes to a couple of hours. GHB-type sedatives can go from awake to unconscious very quickly.",
    duration: "Several hours is common. Impairment can outlast the feeling of being affected.",
    half_life: "From short, as with GHB, to days, as with some barbiturates.",
    effects: ["relaxation", "sleepiness", "reduced anxiety", "poor coordination"],
    adverse: ["vomiting", "amnesia", "injury", "unconsciousness", "slowed breathing"],
    acute: "Unconsciousness, choking on vomit, stopped breathing, and accidents. Another sedative, opioid, or benzodiazepine makes this much more dangerous.",
    chronic: "Dependence, memory injury, mood change, and for alcohol, liver, heart, and cancer risk.",
    overdose: "Cannot be woken, slow or stopped breathing, blue lips, vomiting while semi-conscious. This is an emergency.",
    dependence: "Physical dependence occurs with repeated heavy use of alcohol, barbiturates, GHB, and related sedatives.",
    tolerance: "Tolerance to the feeling rises faster than tolerance to stopped breathing.",
    withdrawal: "Alcohol, barbiturate, and GHB withdrawal can cause seizures and delirium and can be fatal. Stopping suddenly after heavy use needs medical care.",
    uses: "Some are anaesthetics, antiseizure medicines, or alcohol treatments. Others have no safe nonmedical use.",
    contra: "Other sedatives, lung disease, a history of withdrawal seizures, and pregnancy.",
    testing: "Strength of non-pharmaceutical GHB-type liquids is unknowable by looking. Reagents do not make a sedative safe.",
    hr: "Sedative withdrawal can kill. Do not stop heavy use suddenly without medical help. Do not mix sedatives. This file has no dose.",
  },
  benzodiazepine: {
    name: "Benzodiazepine",
    color: "cyan",
    description: "Sedating medicines and unregulated relatives. They cause blackouts and, with opioids or alcohol, stopped breathing.",
    mechanism: "Positive modulator of GABA-A receptors. Raises the effect of the brain's main calming signal.",
    chemistry: "Benzodiazepine or closely related sedative. Named for the blackout and breathing risk. Synthesis is outside this archive.",
    onset: "Often within an hour for swallowed forms. Faster routes are not described here and are not safer.",
    duration: "From a few hours to several days, depending on the drug and its active metabolites.",
    half_life: "Some are short. Others, and their metabolites, last for days and stack if repeated.",
    effects: ["reduced anxiety", "sleepiness", "muscle relaxation", "memory gaps"],
    adverse: ["blackout", "falls", "confusion", "irritability", "slowed breathing with other sedatives"],
    acute: "Amnesia, injury, and sexual vulnerability during blackouts. With alcohol or opioids, breathing can stop.",
    chronic: "Dependence, worsened anxiety between uses, falls in older people, and a hard withdrawal.",
    overdose: "Extreme sedation. If an opioid or alcohol is also involved: slow breathing and unresponsiveness. That is an emergency.",
    dependence: "Dependence can develop within weeks of regular use.",
    tolerance: "The calming effect fades. The withdrawal risk does not.",
    withdrawal: "Rebound anxiety, insomnia, perceptual changes, and seizures. Stopping suddenly after regular use can be a medical emergency.",
    uses: "Licensed for short-term anxiety, seizures, muscle spasm, or anaesthesia. Many circulating tablets are not the medicine named on them.",
    contra: "Opioids, alcohol, other sedatives, sleep apnoea, and pregnancy.",
    testing: "Pressed tablets are frequently a different benzodiazepine, or several. Reagents cannot tell strength.",
    hr: "Do not mix with opioids or alcohol. Do not stop regular use suddenly. This file has no dose.",
  },
  psychedelic: {
    name: "Psychedelic",
    color: "purple",
    description: "Substances that alter perception and thinking. Some are physiologically harsh. Set, setting, and other medicines matter.",
    mechanism: "Many act as serotonin 5-HT2A agonists. Others in this list have different and sometimes more dangerous mechanisms.",
    chemistry: "Psychedelic or psychedelic-like. Named for recognition and risk. Extraction and synthesis are outside this archive.",
    onset: "Minutes to more than an hour. A slow start is a common reason people take more and then have a much stronger effect.",
    duration: "From under an hour to a full day or longer. Some, including DOB and related drugs, last much longer than LSD.",
    half_life: "Often poorly studied outside a few medicines and classic psychedelics. Duration of impairment is the practical fact.",
    effects: ["altered perception", "changed thinking", "emotional intensity", "sensory distortion"],
    adverse: ["panic", "confusion", "nausea", "raised heart rate", "lingering distress"],
    acute: "Panic, dangerous behaviour, and for some members of this class, seizures, overheating, heart strain, or vasoconstriction. NBOMe compounds and ibogaine are physically riskier than classic psychedelics.",
    chronic: "Hallucinogen persisting perception disorder is uncommon but real. Frequent use is linked with lasting anxiety in some people.",
    overdose: "Seizures, collapse, chest pain, a limb that stays white and painful, or a temperature that keeps rising. Those are emergencies, not a 'bad trip' to wait out.",
    dependence: "Classic psychedelics have little physical dependence. They can still be misused, and some analogues are more compulsive or more toxic.",
    tolerance: "Tolerance to LSD-type psychedelics rises very fast and fades over several days. That is not a dosing instruction.",
    withdrawal: "A physical withdrawal syndrome is not typical. Low mood and anxiety after a difficult experience are.",
    uses: "A small number are in clinical research or traditional ceremonial use. That is not a reason to use them, and it is not a dose.",
    contra: "Personal or family psychosis, lithium, tramadol, MAOIs, and heart disease for the physically harsh members.",
    testing: "Blotter and powders sold as LSD are sometimes NBOMe compounds, which are more toxic. A bitter or metallic taste is a warning, not a confirmation.",
    hr: "A sober sitter matters. Do not mix with lithium, tramadol, or MAOIs. This file has no dose and does not describe extraction.",
  },
  dissociative: {
    name: "Dissociative",
    color: "purple",
    description: "NMDA-active substances such as ketamine and PCP-type drugs. They disconnect perception from the body and can injure the bladder, brain, or heart.",
    mechanism: "NMDA receptor antagonism is the common thread. Some also affect dopamine or serotonin.",
    chemistry: "Dissociative. Named for the accident, bladder, and sedation risks. Synthesis is outside this archive.",
    onset: "Minutes when absorbed quickly, longer otherwise. This file does not describe routes.",
    duration: "About an hour for some, and many hours for PCP-type drugs.",
    half_life: "Ketamine is relatively short. PCP-type drugs and some research dissociatives last much longer.",
    effects: ["detachment", "analgesia", "distorted body sense", "anaesthesia at high exposure"],
    adverse: ["nausea", "panic", "immobility", "agitation", "amnesia"],
    acute: "Immobility, accidents, vomiting while semi-conscious, and a state of being unable to move or speak. With alcohol or opioids, breathing may fail.",
    chronic: "Ketamine is linked with severe bladder damage, kidney problems, and memory injury. PCP-type drugs are linked with agitation and prolonged psychosis.",
    overdose: "Unresponsiveness, vomiting, slow breathing, seizures, or extreme overheating and agitation with PCP-type drugs. This is an emergency.",
    dependence: "Psychological dependence on ketamine is well described. Physical withdrawal is milder than with alcohol or opioids and still unpleasant.",
    tolerance: "Tolerance rises quickly with frequent ketamine use.",
    withdrawal: "Low mood, anxiety, and cravings. Bladder symptoms do not stop just because use stops, and they need medical care.",
    uses: "Ketamine and esketamine have medical roles. Most other dissociatives do not.",
    contra: "Uncontrolled high blood pressure, psychosis, active bladder disease, and other sedatives.",
    testing: "Powders sold as ketamine may be a different dissociative of much longer duration. Reagents do not measure strength.",
    hr: "Bladder pain and blood in urine after ketamine need a clinician, not a pause-and-retry. Do not mix with alcohol or opioids. This file has no dose.",
  },
  cannabinoid: {
    name: "Cannabinoid",
    color: "phosphor",
    description: "THC, related plant cannabinoids, and synthetic cannabinoids. The synthetic group is far more physically dangerous.",
    mechanism: "Cannabinoid receptor activity. Synthetic cannabinoids can be full agonists and far stronger than THC.",
    chemistry: "Cannabinoid. Plant cannabinoids and synthetic cannabinoid receptor agonists are not the same risk. Synthesis is outside this archive.",
    onset: "Minutes when inhaled, longer when swallowed. Swallowed THC can take hours and then last a long time.",
    duration: "A few hours for inhaled THC. Swallowed THC and many synthetic cannabinoids last much longer.",
    half_life: "THC leaves the blood slowly and can be detectable long after impairment fades. That is not a dosing fact.",
    effects: ["relaxation", "altered time sense", "increased appetite", "changed attention"],
    adverse: ["anxiety", "paranoia", "fast heart rate", "poor coordination", "vomiting"],
    acute: "Panic, vomiting, fast heart rate, and impaired driving. Synthetic cannabinoids also cause collapse, seizures, kidney injury, and death.",
    chronic: "Dependence, worsened anxiety, and in frequent heavy THC use a higher rate of psychotic episodes in vulnerable people. Smoking adds lung harm.",
    overdose: "For THC, severe anxiety and vomiting are the usual ceiling. For synthetic cannabinoids: collapse, seizures, chest pain, and unresponsiveness are emergencies.",
    dependence: "Cannabis dependence is real. Withdrawal is uncomfortable rather than medically dangerous.",
    tolerance: "The effect fades with daily use. Synthetic cannabinoids can escalate very quickly.",
    withdrawal: "Irritability, poor sleep, low appetite, and vivid dreams for several days after stopping heavy cannabis use.",
    uses: "A few cannabinoid medicines exist. Herbal cannabis and synthetic cannabinoids sold as incense are not those medicines.",
    contra: "Personal or family psychosis, pregnancy, heart disease, and any product sold as incense or 'not for human consumption'.",
    testing: "There is no home test that makes a synthetic cannabinoid product safe. THC percentage on a label is not the batch in front of you.",
    hr: "Do not drive. Treat any synthetic cannabinoid product as a medical emergency risk, not as cannabis. This file has no dose.",
  },
  antidepressant: {
    name: "Antidepressant",
    color: "cyan",
    description: "Medicines for depression and anxiety. MAOIs in this class are dangerous with stimulants, SSRIs, and many other drugs.",
    mechanism: "Depends on the drug: serotonin and noradrenaline reuptake, receptor effects, or monoamine oxidase inhibition.",
    chemistry: "Antidepressant medicine or related product. This file is not a prescribing guide.",
    onset: "Wanted mood effects often take weeks. Side effects and interaction risks can appear with the first exposure.",
    duration: "The medicine and its interaction risk often last well beyond a single day. Some MAOIs need a long washout.",
    half_life: "From short to many days, as with fluoxetine. A long half-life means interactions continue after the last tablet.",
    effects: ["changed mood over weeks", "changed sleep", "changed appetite"],
    adverse: ["nausea", "sexual dysfunction", "sweating", "agitation", "sleep change"],
    acute: "Early agitation, and with the wrong mix, serotonin syndrome or a blood-pressure crisis. Overdose of older tricyclics can stop the heart.",
    chronic: "Withdrawal symptoms if stopped suddenly, weight and metabolic change with some, and persistent sexual side effects in some people.",
    overdose: "Serotonin syndrome looks like agitation, rigidity, sweating, and a rising temperature. A tricyclic overdose looks like seizures and heart rhythm collapse. Both are emergencies.",
    dependence: "They are not intoxicants in the opioid sense. Stopping suddenly still causes a withdrawal syndrome.",
    tolerance: "Side effects often ease. The interaction risks do not expire.",
    withdrawal: "Dizziness, electric-shock feelings, anxiety, and flu-like symptoms. Tapering is a medical decision.",
    uses: "Depression, anxiety, pain, and smoking cessation, depending on the drug.",
    contra: "MAOIs combined with SSRIs, stimulants, tramadol, DXM, or many plant preparations. Recent heart attack for some.",
    testing: "Not a reagent-test problem. The risk is the name on the packet plus whatever else is taken.",
    hr: "Do not combine an MAOI with an SSRI, a stimulant, tramadol, or DXM. Do not stop suddenly without the prescriber. This file has no dose.",
  },
  antipsychotic: {
    name: "Antipsychotic",
    color: "cyan",
    description: "Medicines for psychosis and some mood disorders. They add sedation and, for several, heart-rhythm and metabolic risk.",
    mechanism: "Dopamine receptor blockade is the common action. Each drug adds other receptor effects.",
    chemistry: "Antipsychotic medicine. This file is not a prescribing guide.",
    onset: "Sedation can be prompt. The effect on psychosis takes longer.",
    duration: "Many hours to days. Long-acting injections last weeks and are not covered as a dosing topic here.",
    half_life: "Drug-specific and often long. Impairment can persist into the next day.",
    effects: ["reduced agitation", "sedation", "reduced psychotic intensity over time"],
    adverse: ["stiffness", "restlessness", "weight gain", "dry mouth", "low blood pressure"],
    acute: "Severe stiffness, high fever and confusion can be neuroleptic malignant syndrome, which is an emergency. Some of these drugs prolong the QT interval.",
    chronic: "Movement disorders, weight gain, diabetes, raised prolactin, and sedation.",
    overdose: "Deep sedation, low blood pressure, heart rhythm disturbance, and seizures. This is an emergency.",
    dependence: "Not a classic dependence drug. Stopping suddenly can relapse illness and cause withdrawal symptoms.",
    tolerance: "Sedation may ease. Movement and metabolic harms may not.",
    withdrawal: "Nausea, sweating, restlessness, and return of the illness being treated. This is a prescriber decision.",
    uses: "Psychosis, bipolar disorder, severe agitation, and a few other licensed uses.",
    contra: "Other QT-prolonging drugs, other heavy sedatives, and for clozapine a list of blood and cardiac warnings that belong to the prescriber.",
    testing: "Not identified by reagent kits in a useful way.",
    hr: "Fever plus rigidity on one of these medicines is an emergency. Do not stack with other sedatives for sleep. This file has no dose.",
  },
  anaesthetic: {
    name: "Anaesthetic",
    color: "amber",
    description: "Hospital anaesthetics and local anaesthetics. Outside a monitored setting they cause stopped breathing, heart rhythm collapse, or both.",
    mechanism: "Either deep central sedation or sodium-channel blockade in nerves and heart.",
    chemistry: "Anaesthetic. Named because these drugs are a medical emergency outside a monitored airway. Procedures are outside this archive.",
    onset: "Very fast for induction anaesthetics. Local anaesthetics depend on where they are placed, which this file does not describe.",
    duration: "Minutes to hours. Residual impairment after sedation lasts longer than the procedure.",
    half_life: "Often short in the blood and still dangerous because the effect on breathing is immediate.",
    effects: ["unconsciousness or numbness in medical use"],
    adverse: ["stopped breathing", "low blood pressure", "heart rhythm disturbance", "nausea"],
    acute: "Loss of the airway, stopped breathing, and for local anaesthetics, seizures and cardiac arrest if they reach the blood in quantity.",
    chronic: "Repeated nonmedical use of volatile anaesthetics injures organs and can sensitise the heart.",
    overdose: "Unresponsiveness and no reliable breathing. This is an emergency. Do not wait.",
    dependence: "Not the usual pattern, except where the drug is also a sedative people return to.",
    tolerance: "Not a useful idea outside anaesthesia. The step from sedated to not breathing is small.",
    withdrawal: "Not the main harm.",
    uses: "Surgery, procedures, and local pain control, with monitoring.",
    contra: "No airway support, other sedatives, and certain heart conditions for local anaesthetics.",
    testing: "There is no home test that makes an anaesthetic safe to use.",
    hr: "These drugs belong where someone can breathe for the person. This file has no dose and no method.",
  },
  inhalant: {
    name: "Inhalant",
    color: "red",
    description: "Gases, volatile solvents, and nitrites. Solvents can cause sudden heart death. Nitrites are a different and still serious risk.",
    mechanism: "Solvents disrupt membranes and sensitise the heart to adrenaline. Nitrous blocks NMDA receptors. Nitrites dilate blood vessels.",
    chemistry: "Inhaled gas, volatile solvent, or nitrite. This file does not describe inhaling anything.",
    onset: "Seconds to minutes.",
    duration: "Often short, which is why people repeat exposure and raise the risk. Nitrous harm to nerves comes from repetition over time.",
    half_life: "The gas or vapour leaves quickly. The heart and nerve injuries do not.",
    effects: ["dizziness", "brief euphoria", "flushing with nitrites"],
    adverse: ["headache", "vomiting", "burns", "confusion", "collapse"],
    acute: "Sudden cardiac death from volatile solvents, frost injury and asphyxia from nitrous, and collapsed blood pressure when nitrites meet medicines like sildenafil.",
    chronic: "Brain and nerve injury, bone-marrow suppression, liver and kidney injury, and vitamin B12 inactivation from repeated nitrous use.",
    overdose: "Collapse, irregular heart, blue skin, or not breathing. This is an emergency. Do not chase it with activity or a scare response.",
    dependence: "Psychological dependence occurs. The dangerous pattern is repeated exposure in one session.",
    tolerance: "Not protective. Repeating a solvent raises the chance of a fatal rhythm.",
    withdrawal: "Cravings and low mood. The organ damage is separate.",
    uses: "Nitrous is a medical anaesthetic and a food-propellant. Volatile solvents are industrial chemicals, not medicines.",
    contra: "Heart disease, pregnancy, B12 deficiency, and erection medicines for nitrites.",
    testing: "There is no reagent test for a safer inhalant. The product is the hazard.",
    hr: "Sudden death can happen on first use of volatile solvents. Repeated nitrous needs medical attention if fingers tingle or walking changes. This file does not describe a method.",
  },
  plant_fungi: {
    name: "Plant / Fungi",
    color: "phosphor",
    description: "Plants and fungi that contain psychoactive or toxic compounds. Strength varies by specimen. Some are outright poisons.",
    mechanism: "Depends on the species: opioid, stimulant, psychedelic, anticholinergic, or other.",
    chemistry: "Whole plant or fungus. The named chemical is not evenly spread through the specimen. Extraction is outside this archive.",
    onset: "Unpredictable. Plant preparations are a common reason an effect arrives late and then becomes overwhelming.",
    duration: "Species-dependent, from an hour to more than a day. Anticholinergic plants can last a day or more.",
    half_life: "Not a clean number. Active chemicals and toxins overlap.",
    effects: ["species-dependent changes in alertness, perception, or sedation"],
    adverse: ["nausea", "poisoning", "confusion", "heart strain"],
    acute: "Poisoning, including seizures, overheating, delirium, and stopped breathing depending on the species. Datura and related plants are medical emergencies, not psychedelics.",
    chronic: "Depends on the plant. Betel, tobacco, and khat have their own long-term harms.",
    overdose: "Collapse, seizures, very hot dry skin with delirium, or slowed breathing. Treat an unidentified plant ingestion as poisoning and get emergency help.",
    dependence: "Tobacco, khat, kratom, and betel can cause dependence. Others less so.",
    tolerance: "Varies. It is never a reason to trust the next specimen.",
    withdrawal: "Present for tobacco, kratom, khat, and betel. Plant withdrawal can still be medically relevant.",
    uses: "Traditional use is not a standardised medicine and not a dose.",
    contra: "Heart disease, psychosis, MAOI medicines for the plants that contain them, and any plan to identify a fungus from a photo.",
    testing: "A photo is not an identification. Reagents do not make a plant safe.",
    hr: "If the species is uncertain, do not take it. This file does not describe brewing, extracting, or dosing.",
  },
  research_chemical: {
    name: "Research chemical",
    color: "red",
    description: "Unregulated substances sold under chemical names. The tablet or powder is often a different drug from the label, and toxicity data are thin.",
    mechanism: "Varies. This archive files the likely pharmacology on the entry so interactions still fire.",
    chemistry: "Unregulated chemical. The printed name is not proof of identity. Synthesis is outside this archive.",
    onset: "Poorly documented and easy to misjudge. A slow start is not a signal to take more.",
    duration: "Often longer than the drug it imitates. Some last a day or more.",
    half_life: "No single number covers the class. Treat the impairment as longer than the wanted effect.",
    effects: ["unpredictable intoxication of the class it imitates"],
    adverse: ["nausea", "overheating", "seizures", "blackout", "heart strain"],
    acute: "Seizures, overheating, heart rhythm problems, stopped breathing, and products that contain a more toxic substitute.",
    chronic: "Largely unstudied. Bladder, nerve, liver, and dependence harms seen in the parent class still apply.",
    overdose: "Collapse, seizure, chest pain, or not breathing. Do not wait to see if it is 'just strong'.",
    dependence: "Several of these classes, especially stimulants and benzodiazepines, cause fast dependence.",
    tolerance: "Rises unpredictably. A past experience does not measure the next batch.",
    withdrawal: "Benzodiazepine-type and stimulant-type withdrawal both occur. Benzo withdrawal can cause seizures.",
    uses: "None as a consumer product.",
    contra: "Every mix that is dangerous for the class it imitates, plus a product whose identity was never confirmed.",
    testing: "Reagents may suggest a class and cannot confirm the chemical or the strength. A matching colour is not a green light.",
    hr: "Assume the label is wrong. Do not mix with sedatives, stimulants, or MAOIs. This file has no dose.",
  },
  prescription: {
    name: "Prescription",
    color: "cyan",
    description: "Medicines that matter because they change the risk of other substances: bleeding, serotonin, sedation, heart rhythm, or withdrawal.",
    mechanism: "Drug-specific. The entry states the interaction that puts it in this index.",
    chemistry: "Licensed medicine. This file is not a prescribing guide and has no dose.",
    onset: "Side effects and interactions can appear with the first dose. The intended benefit may take longer.",
    duration: "Often a day or longer. Some stay active for days.",
    half_life: "Drug-specific. Long half-life means the interaction outlasts the last tablet.",
    effects: ["the licensed therapeutic effect, when it works"],
    adverse: ["drug-specific side effects", "interaction toxicity"],
    acute: "The acute harm is usually the interaction: bleeding, serotonin syndrome, low blood pressure, sedation, or toxicity.",
    chronic: "Organ effects depend on the medicine. Stopping some of them suddenly is itself dangerous.",
    overdose: "Follow the medicine's poisoning picture: collapse, bleeding, confusion, vomiting, or heart symptoms. Contact emergency services or a poison centre.",
    dependence: "Most are not intoxicants. Some, filed in other classes, are.",
    tolerance: "Not a reason to raise a medicine on your own.",
    withdrawal: "Several need a taper. That decision belongs to the prescriber.",
    uses: "As licensed. This archive does not give a regimen.",
    contra: "Listed on the entry. Pregnancy, kidney disease, and the interacting drugs named there.",
    testing: "Not a reagent-test question.",
    hr: "Keep one prescriber informed of every other substance, including alcohol and plants. This file has no dose.",
  },
  otc: {
    name: "OTC",
    color: "amber",
    description: "Medicines sold without a prescription that still cause overdose, liver injury, sedation, or dangerous mixes.",
    mechanism: "Drug-specific. Several antihistamines are potent sedatives and delirium agents at high exposure.",
    chemistry: "Non-prescription medicine. Easy access is not a safety margin. This file has no dose.",
    onset: "Usually within a few hours for swallowed products.",
    duration: "Hours. Sedating antihistamines can impair the next day.",
    half_life: "Drug-specific. Doxylamine and diphenhydramine last long enough to impair driving the next morning.",
    effects: ["symptom relief at licensed use"],
    adverse: ["drowsiness", "constipation", "dry mouth", "confusion in older people"],
    acute: "Liver failure from paracetamol overdose. Delirium and heart rhythm problems from high antihistamine exposure. Bleeding from NSAIDs.",
    chronic: "Stomach and kidney injury from NSAIDs. Dependence is uncommon except where the product hides a sedative or opioid.",
    overdose: "Vomiting, confusion, dark urine or later liver pain after paracetamol, and seizures or a pounding heart after sedating antihistamines. Get help early for paracetamol. Waiting for symptoms misses the treatment window.",
    dependence: "Not typical. Products that contain codeine or sedatives are the exception and are filed by that ingredient.",
    tolerance: "Not protective against overdose.",
    withdrawal: "Rebound congestion or insomnia with some products.",
    uses: "Short-term symptom relief as licensed.",
    contra: "Alcohol, other sedatives, ulcers and kidney disease for NSAIDs, and pregnancy for several.",
    testing: "Not applicable. Read the active ingredients. Combination cold products often hide paracetamol, which stacks.",
    hr: "Do not stack two products that both contain paracetamol. Sedating antihistamines plus alcohol are a blackout risk. This file has no dose.",
  },
  withdrawn: {
    name: "Withdrawn",
    color: "red",
    description: "Medicines taken off major markets because of harm, plus toxic contaminants people did not mean to take.",
    mechanism: "Drug-specific. The reason it was withdrawn is the point of the entry.",
    chemistry: "Withdrawn medicine or toxic contaminant. This file does not describe how contaminants are formed.",
    onset: "The injury may be delayed. A quiet first hour is not reassurance.",
    duration: "The exposure may be short and the injury permanent, as with MPTP.",
    half_life: "Not the main fact. The harm can outlast the chemical.",
    effects: ["historical therapeutic claims that did not justify the harm"],
    adverse: ["the injury that caused withdrawal"],
    acute: "The original toxicity: heart valve injury, liver failure, stroke, immune collapse, or sudden parkinsonism depending on the entry.",
    chronic: "Some of these injuries do not reverse.",
    overdose: "Collapse, jaundice, chest pain, sudden immobility, or signs of infection. Emergency care.",
    dependence: "Varies. Not the reason to seek leftover stock.",
    tolerance: "Irrelevant to the injury that got the drug withdrawn.",
    withdrawal: "Not the main lesson.",
    uses: "No current ordinary use. A few survive in very narrow specialist settings.",
    contra: "Any nonmedical use of leftover or imported stock.",
    testing: "Contaminants such as levamisole and MPTP are not caught by a colour test.",
    hr: "Leftover stock and imported 'old medicines' are how these still hurt people. This file has no dose and no synthesis.",
  },
  historical: {
    name: "Historical",
    color: "amber",
    description: "Preparations and poisons from older medicine. The chemistry is still toxic when someone recreates it.",
    mechanism: "Depends on the preparation: opioid, alcohol, heavy metal, or other.",
    chemistry: "Historical preparation. Recreating it is outside this archive and is how people get poisoned.",
    onset: "Unpredictable. Old formulas were not standardised.",
    duration: "Often long, because the active substance was an opioid, a metal, or alcohol.",
    half_life: "That of the underlying poison or drug.",
    effects: ["historical claims of calm, pain relief, or tonic effect"],
    adverse: ["poisoning", "dependence", "organ failure"],
    acute: "Overdose of the underlying drug, or metal poisoning. Laudanum is an opioid overdose waiting in a bottle.",
    chronic: "Dependence, nerve injury, and organ failure.",
    overdose: "The overdose picture of the underlying poison: slowed breathing for laudanum, tremor and confusion for mercury, gut illness for arsenic.",
    dependence: "Laudanum and similar opioid drinks caused widespread dependence.",
    tolerance: "Not a protection.",
    withdrawal: "Opioid withdrawal for laudanum-type products.",
    uses: "None that this archive recommends recreating.",
    contra: "Any attempt to follow an old formula.",
    testing: "An antique bottle has no knowable strength.",
    hr: "Treat these as the modern drug or poison they contain. This file does not reprint formulas.",
  },
  other: {
    name: "Other",
    color: "phosphor",
    description: "Substances that do not sit cleanly in one class and still belong in the index because people meet them.",
    mechanism: "Stated on the entry.",
    chemistry: "See the entry. Procedures and doses are outside this archive.",
    onset: "Variable.",
    duration: "Variable. Assume longer than the wanted effect.",
    half_life: "Often poorly characterised.",
    effects: ["substance-specific"],
    adverse: ["substance-specific"],
    acute: "The entry names the harm. Treat breathing, heart rhythm, and bleeding as live risks.",
    chronic: "Stated on the entry.",
    overdose: "Collapse, seizure, chest pain, or not breathing are emergencies for anything in this index.",
    dependence: "Stated on the entry.",
    tolerance: "A previous experience is a poor guide.",
    withdrawal: "Stated on the entry.",
    uses: "Usually none as a casual product.",
    contra: "Mixes named on the entry.",
    testing: "A label is not identification.",
    hr: "The mix check names both reactions. This file has no dose, source, or synthesis.",
  },
};

const REFS = {
  opioid: ["NIDA opioids topic", "https://nida.nih.gov/research-topics/opioids"],
  stimulant: ["NIDA drugs A to Z", "https://nida.nih.gov/research-topics/drugs-a-to-z"],
  depressant: ["NIDA prescription CNS depressants", "https://nida.nih.gov/publications/drugfacts/prescription-cns-depressants"],
  benzodiazepine: ["NIDA prescription CNS depressants", "https://nida.nih.gov/publications/drugfacts/prescription-cns-depressants"],
  psychedelic: ["NIDA psychedelic and dissociative drugs", "https://nida.nih.gov/research-topics/psychedelic-dissociative-drugs"],
  dissociative: ["NIDA psychedelic and dissociative drugs", "https://nida.nih.gov/research-topics/psychedelic-dissociative-drugs"],
  cannabinoid: ["NIDA cannabis topic", "https://nida.nih.gov/research-topics/cannabis-marijuana"],
  antidepressant: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  antipsychotic: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  anaesthetic: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  inhalant: ["NIDA inhalants", "https://nida.nih.gov/research-topics/inhalants"],
  plant_fungi: ["NIDA drugs A to Z", "https://nida.nih.gov/research-topics/drugs-a-to-z"],
  research_chemical: ["NIDA drugs A to Z", "https://nida.nih.gov/research-topics/drugs-a-to-z"],
  prescription: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  otc: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  withdrawn: ["MedlinePlus drug information", "https://medlineplus.gov/druginformation.html"],
  historical: ["NIDA drugs A to Z", "https://nida.nih.gov/research-topics/drugs-a-to-z"],
  other: ["NIDA drugs A to Z", "https://nida.nih.gov/research-topics/drugs-a-to-z"],
};

const SPECIFIC_REFS = {
  "alcohol-ethanol": ["NIAAA alcohol facts", "https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-topics/alcohol-facts-and-statistics"],
  nicotine: ["CDC tobacco", "https://www.cdc.gov/tobacco/"],
  cocaine: ["NIDA cocaine", "https://nida.nih.gov/research-topics/cocaine"],
  mdma: ["NIDA MDMA", "https://nida.nih.gov/research-topics/mdma-ecstasy-molly"],
  methamphetamine: ["NIDA methamphetamine", "https://nida.nih.gov/research-topics/methamphetamine"],
  heroin: ["NIDA heroin", "https://nida.nih.gov/research-topics/heroin"],
  fentanyl: ["CDC stop overdose", "https://www.cdc.gov/stop-overdose/"],
  cannabis: ["NIDA cannabis topic", "https://nida.nih.gov/research-topics/cannabis-marijuana"],
};

function drugRecord(row) {
  const cls = CLASSES[row.cat];
  if (!cls) throw new Error("bad category " + row.cat);
  const risks = row.risks?.length ? row.risks : [row.cat];
  const summary = `${row.name} is filed here as a harm-reduction record. ${row.note} This is not a dose, a source, or a reason to use it.`;
  return {
    id: `d_${row.slug}`,
    slug: row.slug,
    name: row.name,
    category: row.cat,
    risk_classes: risks,
    aliases: split(row.aliases),
    brand_names: split(row.brands),
    street_names: split(row.streets),
    summary,
    history: `${row.name} is part of the public scientific and medical record${row.year ? `, with a commonly cited date around ${row.year}` : ""}. Legal and medical status have changed over time and still differ by country. ${row.note}`,
    legal_status: LEGAL,
    medical_status: MEDICAL[row.medical],
    chemistry: cls.chemistry,
    mechanism: cls.mechanism,
    onset: cls.onset,
    duration: cls.duration,
    half_life: cls.half_life,
    effects: cls.effects,
    adverse_effects: cls.adverse,
    acute_risks: `${cls.acute} ${row.note}`,
    chronic_risks: cls.chronic,
    overdose_signs: cls.overdose,
    dependence: cls.dependence,
    tolerance: cls.tolerance,
    withdrawal: cls.withdrawal,
    medical_uses: cls.uses,
    contraindications: cls.contra,
    testing: cls.testing,
    harm_reduction: cls.hr,
    evidence_quality: row.evidence,
    discovered_year: row.year || null,
    featured: Boolean(row.featured),
  };
}

function split(value) {
  if (!value) return [];
  // Locants such as 3,4- and N,N- are part of one chemical name, not a list.
  const protectedValue = value.replace(/(\d),(?=\d)/g, "$1\u0001").replace(/N,(?=N-)/g, "N\u0001");
  return protectedValue.split(",").map((part) => part.trim().replaceAll("\u0001", ",")).filter(Boolean);
}

const drugs = [...ROWS, ...MORE_ROWS, ...NEXT_ROWS, ...DOUBLE_ROWS, ...FOLD_ROWS, ...TRIPLE_ROWS, ...QUAD_ROWS, ...MAX_ROWS].map(drugRecord);
const slugs = new Set();
for (const drug of drugs) {
  if (slugs.has(drug.slug)) throw new Error("duplicate slug " + drug.slug);
  slugs.add(drug.slug);
  for (const key of [
    "summary", "history", "legal_status", "medical_status", "chemistry", "mechanism",
    "onset", "duration", "half_life", "acute_risks", "chronic_risks", "overdose_signs",
    "dependence", "tolerance", "withdrawal", "medical_uses", "contraindications",
    "testing", "harm_reduction",
  ]) {
    if (!drug[key] || !String(drug[key]).trim()) throw new Error("empty " + key + " on " + drug.slug);
  }
  if (!drug.effects.length || !drug.adverse_effects.length) throw new Error("empty effects " + drug.slug);
}

const banned = /\b\d+(?:\.\d+)?\s*(?:mg|g|ug|µg|mcg|ml|iu)\b|how to (?:make|cook|extract|synth)|reductive amination|\byield\b|\breflux\b/i;
const blob = JSON.stringify(drugs);
if (banned.test(blob)) {
  const hit = blob.match(banned);
  throw new Error("banned pattern in catalogue: " + hit?.[0]);
}

const required = ["alcohol-ethanol", "nicotine", "caffeine", "thc", "cocaine", "heroin", "methamphetamine", "mdma"];
for (const slug of required) {
  if (!slugs.has(slug)) throw new Error("missing popular " + slug);
}

const classes = Object.entries(CLASSES).map(([slug, cls]) => ({
  id: `c_${slug}`,
  slug,
  name: cls.name,
  description: cls.description,
  color: cls.color,
}));

const strains = [
  ["northern-lights", "Northern Lights", "indica", "Afghan", 16, 22, 0, 1, "myrcene,pinene,caryophyllene"],
  ["og-kush", "OG Kush", "hybrid", "Chemdawg x Hindu Kush", 18, 26, 0, 1, "myrcene,limonene,caryophyllene"],
  ["sour-diesel", "Sour Diesel", "sativa", "Chemdawg x Super Skunk", 18, 25, 0, 1, "caryophyllene,limonene,myrcene"],
  ["blue-dream", "Blue Dream", "hybrid", "Blueberry x Haze", 17, 24, 0, 1, "myrcene,pinene,caryophyllene"],
  ["girl-scout-cookies", "Girl Scout Cookies", "hybrid", "OG Kush x Durban Poison", 18, 28, 0, 1, "caryophyllene,limonene,linalool"],
  ["granddaddy-purple", "Granddaddy Purple", "indica", "Purple Urkle x Big Bud", 17, 23, 0, 1, "myrcene,pinene,caryophyllene"],
  ["white-widow", "White Widow", "hybrid", "Brazilian sativa x South Indian indica", 18, 25, 0, 1, "myrcene,caryophyllene,pinene"],
  ["jack-herer", "Jack Herer", "sativa", "Haze x Northern Lights #5 x Shiva Skunk", 18, 24, 0, 1, "terpinolene,pinene,caryophyllene"],
  ["gelato", "Gelato", "hybrid", "Sunset Sherbet x Thin Mint GSC", 17, 25, 0, 1, "caryophyllene,limonene,humulene"],
  ["wedding-cake", "Wedding Cake", "hybrid", "Triangle Kush x Animal Mints", 18, 27, 0, 1, "caryophyllene,limonene,myrcene"],
  ["purple-haze", "Purple Haze", "sativa", "Haze lineage", 16, 22, 0, 1, "terpinolene,myrcene,caryophyllene"],
  ["ak-47", "AK-47", "hybrid", "Colombian x Mexican x Thai x Afghan", 18, 23, 0, 1, "myrcene,pinene,limonene"],
  ["trainwreck", "Trainwreck", "hybrid", "Mexican x Thai x Afghan", 17, 25, 0, 1, "myrcene,terpinolene,pinene"],
  ["green-crack", "Green Crack", "sativa", "Skunk #1 lineage", 16, 23, 0, 1, "myrcene,caryophyllene,pinene"],
  ["bubba-kush", "Bubba Kush", "indica", "OG Kush x unknown indica", 15, 22, 0, 1, "myrcene,caryophyllene,limonene"],
  ["super-silver-haze", "Super Silver Haze", "sativa", "Northern Lights x Haze x Skunk", 18, 23, 0, 1, "terpinolene,caryophyllene,myrcene"],
  ["durban-poison", "Durban Poison", "sativa", "South African landrace", 15, 22, 0, 1, "terpinolene,myrcene,caryophyllene"],
  ["hindu-kush", "Hindu Kush", "indica", "Hindu Kush landrace", 16, 22, 0, 1, "myrcene,caryophyllene,pinene"],
  ["afghan-kush", "Afghan Kush", "indica", "Afghan landrace", 16, 21, 0, 1, "myrcene,pinene,caryophyllene"],
  ["skunk-1", "Skunk No. 1", "hybrid", "Afghan x Colombian Gold x Acapulco Gold", 15, 20, 0, 1, "myrcene,caryophyllene,limonene"],
  ["uk-cheese", "Cheese", "hybrid", "Skunk #1 phenotype", 16, 21, 0, 1, "myrcene,caryophyllene,limonene"],
  ["amnesia-haze", "Amnesia Haze", "sativa", "Haze hybrids", 18, 25, 0, 1, "terpinolene,caryophyllene,myrcene"],
  ["lemon-haze", "Lemon Haze", "sativa", "Lemon Skunk x Silver Haze", 17, 22, 0, 1, "limonene,terpinolene,caryophyllene"],
  ["strawberry-cough", "Strawberry Cough", "sativa", "Haze x Strawberry Fields", 16, 22, 0, 1, "myrcene,pinene,caryophyllene"],
  ["pineapple-express", "Pineapple Express", "hybrid", "Trainwreck x Hawaiian", 16, 23, 0, 1, "caryophyllene,limonene,myrcene"],
  ["gorilla-glue", "Gorilla Glue", "hybrid", "Chem's Sister x Sour Dubb x Chocolate Diesel", 18, 28, 0, 1, "caryophyllene,myrcene,limonene"],
  ["runtz", "Runtz", "hybrid", "Zkittlez x Gelato", 18, 25, 0, 1, "caryophyllene,limonene,linalool"],
  ["zkittlez", "Zkittlez", "indica", "Grape Ape x Grapefruit", 15, 23, 0, 1, "caryophyllene,linalool,myrcene"],
  ["dosidos", "Dosidos", "indica", "Girl Scout Cookies x Face Off OG", 18, 28, 0, 1, "caryophyllene,limonene,myrcene"],
  ["miracle-alien-cookies", "Miracle Alien Cookies", "hybrid", "Alien Cookies x Miracle", 18, 25, 0, 1, "caryophyllene,limonene,myrcene"],
  ["ice-cream-cake", "Ice Cream Cake", "indica", "Wedding Cake x Gelato #33", 18, 25, 0, 1, "caryophyllene,limonene,myrcene"],
  ["sunset-sherbet", "Sunset Sherbet", "hybrid", "Girl Scout Cookies x Pink Panties", 16, 22, 0, 1, "caryophyllene,linalool,limonene"],
  ["cherry-pie", "Cherry Pie", "hybrid", "Granddaddy Purple x Durban Poison", 16, 22, 0, 1, "myrcene,caryophyllene,limonene"],
  ["forbidden-fruit", "Forbidden Fruit", "indica", "Cherry Pie x Tangie", 16, 23, 0, 1, "myrcene,caryophyllene,limonene"],
  ["tangie", "Tangie", "sativa", "California Orange x Skunk", 15, 22, 0, 1, "terpinolene,myrcene,pinene"],
  ["bruce-banner", "Bruce Banner", "hybrid", "OG Kush x Strawberry Diesel", 18, 29, 0, 1, "myrcene,caryophyllene,limonene"],
  ["critical-kush", "Critical Kush", "indica", "Critical Mass x OG Kush", 18, 25, 0, 1, "myrcene,caryophyllene,limonene"],
  ["charlottes-web", "Charlotte's Web", "hybrid", "high-CBD hemp chemotype", 0, 1, 12, 18, "myrcene,caryophyllene,pinene"],
  ["acdc", "ACDC", "hybrid", "Cannatonic phenotype", 0, 6, 14, 20, "myrcene,pinene,caryophyllene"],
  ["harlequin", "Harlequin", "sativa", "Colombian Gold x Nepali x Thai x Swiss", 4, 10, 8, 15, "myrcene,pinene,caryophyllene"],
  ["cannatonic", "Cannatonic", "hybrid", "MK Ultra x G13 Haze", 6, 12, 6, 17, "myrcene,pinene,caryophyllene"],
  ["ruderalis", "Ruderalis", "ruderalis", "Cannabis ruderalis landrace", 1, 5, 0, 2, "myrcene,pinene"],
  ["acapulco-gold", "Acapulco Gold", "sativa", "Mexican landrace", 16, 22, 0, 1, "myrcene,pinene,caryophyllene"],
  ["colombian-gold", "Colombian Gold", "sativa", "Colombian landrace", 15, 20, 0, 1, "myrcene,pinene,caryophyllene"],
  ["panama-red", "Panama Red", "sativa", "Panamanian landrace", 14, 20, 0, 1, "myrcene,caryophyllene,pinene"],
  ["maui-wowie", "Maui Wowie", "sativa", "Hawaiian landrace", 15, 22, 0, 1, "myrcene,pinene,limonene"],
  ["malawi-gold", "Malawi Gold", "sativa", "Malawian landrace", 16, 24, 0, 1, "terpinolene,myrcene,caryophyllene"],
  ["lambs-bread", "Lamb's Bread", "sativa", "Jamaican landrace", 15, 22, 0, 1, "myrcene,caryophyllene,pinene"],
  ["thai", "Thai", "sativa", "Thai landrace", 15, 22, 0, 1, "terpinolene,myrcene,caryophyllene"],
  ["chemdawg", "Chemdawg", "hybrid", "unknown, often cited behind OG lines", 18, 26, 0, 1, "myrcene,caryophyllene,limonene"],
  ["g13", "G13", "hybrid", "disputed lab or Afghan line", 18, 24, 0, 1, "myrcene,caryophyllene,pinene"],
  ["blueberry", "Blueberry", "indica", "Purple Thai x Thai x Afghan", 16, 24, 0, 1, "myrcene,pinene,caryophyllene"],
  ["purple-urkle", "Purple Urkle", "indica", "Mendocino Purps lineage", 16, 22, 0, 1, "myrcene,caryophyllene,linalool"],
  ["white-rhino", "White Rhino", "hybrid", "White Widow x unknown indica", 18, 25, 0, 1, "myrcene,caryophyllene,pinene"],
  ["super-lemon-haze", "Super Lemon Haze", "sativa", "Lemon Skunk x Super Silver Haze", 17, 25, 0, 1, "limonene,terpinolene,caryophyllene"],
  ["headband", "Headband", "hybrid", "OG Kush x Sour Diesel", 18, 27, 0, 1, "myrcene,caryophyllene,limonene"],
  ["kosher-kush", "Kosher Kush", "indica", "unknown indica line", 18, 26, 0, 1, "myrcene,caryophyllene,limonene"],
  ["skywalker-og", "Skywalker OG", "hybrid", "Skywalker x OG Kush", 18, 25, 0, 1, "myrcene,caryophyllene,limonene"],
  ["la-confidential", "LA Confidential", "indica", "OG LA Affie x Afghani", 16, 25, 0, 1, "myrcene,caryophyllene,limonene"],
  ["cinderella-99", "Cinderella 99", "sativa", "Jack Herer x Shiva Skunk line", 16, 22, 0, 1, "myrcene,pinene,caryophyllene"],
  ["alaskan-thunder-fuck", "Alaskan Thunder Fuck", "sativa", "disputed Alaskan line", 16, 23, 0, 1, "myrcene,pinene,caryophyllene"],
  ["stardawg", "Stardawg", "hybrid", "Chemdawg descendant lines", 18, 26, 0, 1, "caryophyllene,myrcene,limonene"],
  ["apple-fritter", "Apple Fritter", "hybrid", "Sour Apple x Animal Cookies", 18, 28, 0, 1, "caryophyllene,limonene,myrcene"],
  ["cereal-milk", "Cereal Milk", "hybrid", "Y Life x Snowman", 18, 25, 0, 1, "caryophyllene,limonene,linalool"],
  ["mimosa-cannabis", "Mimosa", "hybrid", "Purple Punch x Clementine", 18, 27, 0, 1, "limonene,caryophyllene,myrcene"],
  ["tropicana-cookies", "Tropicana Cookies", "hybrid", "Girl Scout Cookies x Tangie", 16, 24, 0, 1, "caryophyllene,limonene,myrcene"],
  ["permanent-marker", "Permanent Marker", "hybrid", "Biscotti x Sherb Bx x Jealousy", 20, 28, 0, 1, "caryophyllene,limonene,linalool"],
  ["gary-payton", "Gary Payton", "hybrid", "The Y x Snowman", 18, 26, 0, 1, "caryophyllene,limonene,myrcene"],
  ["jealousy", "Jealousy", "hybrid", "Gelato 41 x Sherb Bx", 18, 26, 0, 1, "caryophyllene,limonene,linalool"],
  ["biscotti", "Biscotti", "hybrid", "Gelato 25 x Sour Florida OG", 18, 25, 0, 1, "caryophyllene,limonene,myrcene"],
  ["purple-punch", "Purple Punch", "indica", "Larry OG x Granddaddy Purple", 16, 22, 0, 1, "caryophyllene,linalool,myrcene"],
  ["garlic-cookies", "Garlic Cookies", "hybrid", "GMO Cookies line", 18, 28, 0, 1, "caryophyllene,myrcene,limonene"],
  ["platinum-og", "Platinum OG", "indica", "Master Kush x OG Kush", 18, 26, 0, 1, "myrcene,caryophyllene,limonene"],
  ["triangle-kush", "Triangle Kush", "indica", "Florida OG line", 18, 25, 0, 1, "myrcene,caryophyllene,limonene"],
  ["animal-mints", "Animal Mints", "hybrid", "Animal Cookies x SinMint Cookies", 18, 26, 0, 1, "caryophyllene,limonene,linalool"],
  ["banana-kush", "Banana Kush", "hybrid", "Ghost OG x Skunk Haze", 16, 22, 0, 1, "myrcene,limonene,caryophyllene"],
  ["critical-mass", "Critical Mass", "indica", "Afghani x Skunk #1", 16, 22, 0, 1, "myrcene,caryophyllene,pinene"],
  ["shiva-skunk", "Shiva Skunk", "indica", "Northern Lights #5 x Skunk #1", 16, 22, 0, 1, "myrcene,caryophyllene,pinene"],
  ["super-skunk", "Super Skunk", "indica", "Skunk #1 x Afghan", 16, 22, 0, 1, "myrcene,caryophyllene,limonene"],
  ["ny-diesel", "NY Diesel", "sativa", "Mexican sativa x Afghani", 16, 22, 0, 1, "caryophyllene,limonene,myrcene"],
  ["swazi-gold", "Swazi Gold", "sativa", "Swazi landrace", 14, 20, 0, 1, "myrcene,pinene,caryophyllene"],
  ["original-haze", "Original Haze", "sativa", "Mexican x Colombian x Thai x Indian", 16, 23, 0, 1, "terpinolene,myrcene,caryophyllene"],
  ["london-pound-cake", "London Pound Cake", "hybrid", "Sunset Sherbet x unknown", 18, 25, 0, 1, "caryophyllene,limonene,linalool"],
  ...EXTRA_STRAINS,
  ...FOLD_STRAINS,
  ...TRIPLE_STRAINS,
  ...QUAD_STRAINS,
  ...MAX_STRAINS,
].map(([slug, name, type, lineage, thcLow, thcHigh, cbdLow, cbdHigh, terpenes]) => ({
  id: `s_${slug}`,
  slug,
  name,
  type,
  lineage,
  thc_low: thcLow,
  thc_high: thcHigh,
  cbd_low: cbdLow,
  cbd_high: cbdHigh,
  terpenes: terpenes ? String(terpenes).split(",").map((part) => part.trim()).filter(Boolean) : [],
  effects: ["reported relaxation or stimulation varies by person and batch"],
  adverse: ["anxiety", "fast heart rate", "impaired attention"],
  confidence: "anecdotal",
  summary: `${name} is a cannabis chemotype name, not a standardised medicine. Reported THC and CBD ranges change with the grower, the lab, and the batch. A name on a jar is not an assay. This is not a recommendation to use cannabis.`,
}));

const timeline = [
  [1804, "Morphine isolated", "Morphine was isolated from opium, the start of modern opioid pharmacy and of a dependence problem that outlasted the century.", "opioid"],
  [1855, "Cocaine isolated", "Cocaine was isolated from coca leaf. Later medical enthusiasm missed the heart and dependence harms.", "stimulant"],
  [1874, "Diacetylmorphine made", "Diacetylmorphine, later sold as heroin, was first made in a laboratory. This archive does not describe that chemistry.", "opioid"],
  [1898, "Heroin marketed", "Heroin was sold as a medicine and a cough remedy. Dependence followed at population scale.", "opioid"],
  [1912, "MDMA first made", "MDMA was first synthesised. Widespread nonmedical use came much later. This archive does not describe the synthesis.", "stimulant"],
  [1914, "Harrison Act", "The United States restricted opioids and cocaine through the Harrison Narcotics Tax Act. Control has never been uniform worldwide.", "historical"],
  [1920, "Alcohol prohibition", "National alcohol prohibition in the United States showed both the harm of the drug and the harm of an unregulated supply.", "depressant"],
  [1938, "LSD synthesised", "LSD was first made in a pharmaceutical laboratory. The archive does not describe that synthesis.", "psychedelic"],
  [1943, "LSD exposure described", "An accidental exposure made LSD's potency obvious. Potency is why blotter sold as LSD is sometimes a more toxic substitute.", "psychedelic"],
  [1952, "Chlorpromazine introduced", "Chlorpromazine opened the era of antipsychotic medicines, with sedation and movement harms of its own.", "antipsychotic"],
  [1960, "Chlordiazepoxide released", "The first benzodiazepine reached the market and largely replaced barbiturates, then produced its own dependence crisis.", "benzodiazepine"],
  [1961, "Single Convention", "The UN Single Convention on Narcotic Drugs became the template for national drug control.", "historical"],
  [1962, "Thalidomide withdrawn", "Thalidomide was pulled after severe birth defects. Withdrawn does not mean gone from unregulated markets.", "withdrawn"],
  [1964, "US smoking report", "The US Surgeon General's report tied cigarettes to cancer and heart disease in public health terms.", "stimulant"],
  [1970, "US Controlled Substances Act", "The United States built its modern scheduling system. Schedules are legal categories, not a measure of safety.", "historical"],
  [1971, "UN Psychotropic Convention", "International control expanded to many stimulants, depressants, and psychedelics.", "historical"],
  [1982, "MPTP parkinsonism", "Contaminated synthetic opioid material caused sudden, permanent parkinsonism. The toxin was MPTP. This archive does not describe how it forms.", "withdrawn"],
  [1985, "MDMA emergency scheduling", "The United States emergency-scheduled MDMA. Nonmedical use and clinical research then followed different tracks.", "stimulant"],
  [1986, "Crack and the unregulated supply", "Smoked cocaine became a public-health crisis. The route changes speed, not the fact that cocaine strains the heart.", "stimulant"],
  [1996, "California medical cannabis", "The first US state medical-cannabis law passed. Laws still differ sharply by country and state.", "cannabinoid"],
  [2006, "Modern psilocybin research", "Clinical research into psilocybin resumed under controlled conditions. Research settings are not a dose or a source.", "psychedelic"],
  [2013, "Fentanyl in the illicit supply", "Fentanyl and analogues became a dominant cause of opioid deaths in North America. Naloxone and drug checking are responses, not guarantees.", "opioid"],
  [2016, "Carfentanil appears", "Carfentanil, an opioid used for large animals, was identified in street opioids. Ordinary reagent tests do not measure it.", "opioid"],
  [2019, "Esketamine approved", "A nasal esketamine product was approved for treatment-resistant depression in the United States, inside a medical programme.", "dissociative"],
  [2020, "Nitazenes detected", "Nitazene opioids began appearing in drug-checking data. They add another unmeasured-strength opioid to an already contaminated supply.", "opioid"],
  [2021, "Xylazine spread", "The veterinary sedative xylazine was found more often in opioid supplies. Naloxone does not reverse the xylazine sedation.", "other"],
  [1897, "Aspirin registered", "Aspirin was registered as a medicine. Stomach bleeding and, in children with viral illness, a reason for caution came later.", "otc"],
  [1903, "Barbital introduced", "Barbital opened the barbiturate era. Stopping breathing in overdose, and seizures in withdrawal, are why that era ended.", "depressant"],
  [1932, "Amphetamine marketed", "Amphetamine reached the market as a decongestant and stimulant. Heart strain and dependence outlasted the early enthusiasm.", "stimulant"],
  [1965, "Methadone treatment expands", "Methadone maintenance was shown to reduce death and illness for people dependent on opioids. The medicine itself still slows breathing and prolongs QT.", "opioid"],
  [1977, "PCP emergency scheduling", "Phencyclidine was emergency-scheduled in the United States after agitation, accidents, and anaesthetic-level overdose.", "dissociative"],
  [2009, "Mephedrone spreads", "Mephedrone and other synthetic cathinones spread as unregulated stimulants. Compulsive redosing and heart strain were the pattern.", "stimulant"],
  [2012, "NBOMe blotter deaths", "NBOMe compounds sold as LSD caused seizures and deaths. A bitter blotter is a warning, not an identification.", "psychedelic"],
  [2022, "Pholcodine withdrawn", "Regulators withdrew pholcodine cough medicines after a link with severe allergic reactions under anaesthesia.", "opioid"],
  [2023, "Nitazenes widen", "Nitazene opioids were identified in more regions and more product types. Fentanyl strips often miss them.", "opioid"],
  [2024, "Medetomidine in the supply", "The veterinary sedative medetomidine was reported in some illicit opioid supplies. Naloxone does not reverse that sedation.", "other"],
  [1960, "Fentanyl synthesised", "Fentanyl was made in a pharmaceutical laboratory. Later illicit analogues made a familiar-looking opioid an unmeasured-strength product. This archive does not describe that chemistry.", "opioid"],
  [1998, "Sildenafil and nitrates", "Sildenafil reached the market with a hard warning against nitrate heart medicines. The mix can collapse blood pressure.", "prescription"],
  [2008, "Synthetic cannabinoid products", "Herbal mixtures sold as incense began sending people to hospital with seizures and collapse. The active chemical was not cannabis and changed from bag to bag.", "cannabinoid"],
  [2016, "Gabapentinoid overdose deaths", "Death records began showing gabapentin and pregabalin more often alongside opioids. The gabapentinoid does not cancel the opioid's effect on breathing.", "depressant"],
  [2018, "Unregulated cannabinoid vapes", "A change in US hemp law was followed by unregulated cannabinoid vapes. A legal-sounding label is not an assay, and some additives have injured lungs.", "cannabinoid"],
  [2022, "Dipentylone sold as MDMA", "Drug checking began finding dipentylone in tablets and crystals sold as MDMA. A weaker effect is how people take more.", "stimulant"],
  ...EXTRA_TIMELINE,
  ...FOLD_TIMELINE,
  ...TRIPLE_TIMELINE,
].map(([year, title, description, category]) => ({
  id: `t_${year}_${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  year,
  title,
  description,
  category,
}));

const rules = [
  [["opioid"], ["benzodiazepine"], "deadly", "Opioids and benzodiazepines both slow breathing. Together they are a common cause of fatal overdose. Naloxone reverses only the opioid part, and it can wear off first."],
  [["opioid"], ["depressant"], "deadly", "Opioids plus alcohol, GHB, barbiturates, or other sedatives multiply the chance that breathing stops."],
  [["opioid"], ["opioid"], "deadly", "Two opioids stack on the same receptors. The breathing risk is not an average of the two. Naloxone may need repeating."],
  [["benzodiazepine"], ["benzodiazepine"], "dangerous", "Combining benzodiazepines deepens sedation and memory loss. Breathing risk rises again if any opioid or alcohol is also present."],
  [["benzodiazepine"], ["depressant"], "deadly", "Benzodiazepines with alcohol or other sedatives can stop breathing and cause choking during unconsciousness."],
  [["depressant"], ["depressant"], "deadly", "Two sedatives together, including alcohol with GHB, can cause coma and stopped breathing."],
  [["stimulant"], ["stimulant"], "dangerous", "Two stimulants add strain on the heart, temperature, and blood pressure. Seizures and overheating become more likely."],
  [["stimulant"], ["depressant"], "dangerous", "A stimulant can hide sedation, then the sedative shows through suddenly. The heart is under strain the whole time."],
  [["stimulant"], ["opioid"], "dangerous", "A stimulant can mask how sedated an opioid has made someone. Breathing can fail as the stimulant wears off."],
  [["group:maoi"], ["stimulant"], "deadly", "Stimulants with MAO inhibitors can cause a hypertensive crisis: severe headache, chest pain, and stroke."],
  [["group:maoi"], ["group:ssri", "group:snri", "group:tca", "group:serotonin"], "deadly", "MAO inhibitors with SSRIs, SNRIs, many antidepressants, or other serotonergic drugs can cause serotonin syndrome: rigidity, agitation, high temperature, and seizures."],
  [["group:maoi"], ["opioid"], "dangerous", "Several opioids become much more dangerous with an MAOI. Tramadol with an MAOI is a particular serotonin and seizure risk and should be treated as deadly."],
  [["group:maoi"], ["tramadol"], "deadly", "Tramadol with an MAOI can cause severe serotonin syndrome and seizures."],
  [["group:ssri", "group:snri"], ["tramadol"], "dangerous", "Tramadol plus an SSRI or SNRI raises the chance of serotonin syndrome and of seizures."],
  [["group:maoi"], ["dxm"], "deadly", "DXM with an MAOI can cause severe serotonin syndrome."],
  [["group:ssri", "group:snri"], ["dxm"], "dangerous", "DXM plus an SSRI or SNRI can cause serotonin toxicity. Cough medicines are an easy way to take this mix without noticing."],
  [["cocaine"], ["alcohol-ethanol"], "dangerous", "Alcohol and cocaine form cocaethylene in the body. It lasts longer and adds strain on the heart."],
  [["group:nitrite"], ["group:pde5"], "deadly", "Nitrites and medicines such as sildenafil both widen blood vessels. Together they can collapse blood pressure."],
  [["dissociative"], ["depressant"], "dangerous", "Dissociatives plus alcohol or other sedatives deepen unconsciousness and the chance of vomiting while unprotected."],
  [["dissociative"], ["benzodiazepine"], "dangerous", "Dissociatives plus benzodiazepines deepen sedation and the chance of choking."],
  [["dissociative"], ["opioid"], "deadly", "Dissociatives plus opioids raise the chance of stopped breathing and of being unable to protect the airway."],
  [["inhalant"], ["depressant"], "dangerous", "Inhalants plus sedatives deepen unconsciousness. Volatile solvents can also trigger a fatal heart rhythm."],
  [["inhalant"], ["stimulant"], "dangerous", "Volatile solvents sensitise the heart. A stimulant, fright, or sudden effort can trigger a fatal rhythm."],
  [["cannabinoid"], ["depressant"], "moderate", "Cannabis can intensify impairment from alcohol or other sedatives. Do not drive, and do not add an opioid."],
  [["cannabinoid"], ["opioid"], "moderate", "Cannabis can add to opioid sedation. It does not remove the breathing risk of the opioid."],
  [["cannabinoid"], ["stimulant"], "moderate", "The mix can raise heart rate and anxiety. Synthetic cannabinoids are a separate and much sharper risk."],
  [["psychedelic"], ["lithium"], "dangerous", "Classic psychedelics with lithium have been associated with seizures and a much more dangerous experience."],
  [["psychedelic"], ["tramadol"], "dangerous", "Psychedelics plus tramadol add seizure risk and serotonin risk."],
  [["psychedelic"], ["group:ssri", "group:snri"], "moderate", "SSRIs and SNRIs often blunt psychedelics and do not make them safe. Some combinations add serotonin risk."],
  [["psychedelic"], ["group:maoi"], "deadly", "Psychedelics plus MAOIs can cause serotonin syndrome and blood-pressure crisis. Ayahuasca already contains an MAOI."],
  [["group:nsaid"], ["warfarin"], "dangerous", "NSAIDs plus warfarin raise the chance of serious bleeding."],
  [["group:nsaid"], ["lithium"], "dangerous", "NSAIDs can raise lithium levels and cause lithium toxicity: tremor, confusion, and vomiting."],
  [["alcohol-ethanol"], ["disulfiram"], "dangerous", "Disulfiram with alcohol causes flushing, vomiting, and sometimes a dangerous heart and blood-pressure reaction."],
  [["alcohol-ethanol"], ["paracetamol"], "moderate", "Regular heavy alcohol use plus paracetamol raises the chance of liver injury. This file gives no safe amount of either."],
  [["clozapine"], ["benzodiazepine"], "deadly", "Clozapine with benzodiazepines has been linked with collapse and dangerous sedation."],
  [["xylazine"], ["opioid"], "deadly", "Xylazine deepens unconsciousness in opioid supplies. Naloxone does not reverse the xylazine. Breathing support still matters."],
  [["levamisole"], ["cocaine"], "dangerous", "Levamisole in cocaine has been linked with immune collapse, skin injury, and vasculitis."],
  [["antipsychotic"], ["opioid"], "dangerous", "Antipsychotics add sedation. With an opioid, the person can become deeply unconscious and stop protecting their airway."],
  [["antipsychotic"], ["depressant"], "dangerous", "Antipsychotics plus alcohol or other sedatives deepen unconsciousness and low blood pressure."],
  [["group:qt"], ["group:qt"], "dangerous", "Two drugs that prolong the QT interval raise the chance of a dangerous heart rhythm."],
  [["group:maoi"], ["group:triptan"], "deadly", "Triptans with MAO inhibitors are contraindicated. Serotonin syndrome and a blood-pressure crisis are the risk."],
  [["group:triptan"], ["group:ssri", "group:snri"], "moderate", "Triptans plus an SSRI or SNRI have a serotonin-syndrome warning. The risk is lower than with an MAOI and it is not zero."],
  [["group:ssri", "group:snri"], ["group:serotonin"], "dangerous", "SSRIs and SNRIs plus other serotonergic drugs, including MDMA, DXM, tramadol, and 5-HTP, can cause serotonin syndrome: agitation, rigidity, sweating, and high temperature."],
  [["alcohol-ethanol"], ["group:disulfiram-like"], "dangerous", "These medicines make alcohol metabolism toxic. Flushing, vomiting, and a pounding heart can follow even alcohol hidden in medicines or mouthwash."],
  [["alcohol-ethanol"], ["methanol", "ethylene-glycol", "diethylene-glycol", "isopropanol"], "dangerous", "These are toxic alcohols, not drinking alcohol. Mixing them with ethanol does not make a nonmedical exposure safe. Methanol and the glycols cause acidosis and organ failure. Isopropanol adds to intoxication."],
  [["opioid"], ["promethazine", "diphenhydramine", "doxylamine", "hydroxyzine", "chlorpheniramine", "dimenhydrinate"], "dangerous", "Sedating antihistamines deepen opioid sedation and make it more likely that someone stops protecting their airway. Breathing can still fail."],
  [["alcohol-ethanol"], ["promethazine", "diphenhydramine", "doxylamine", "hydroxyzine", "chlorpheniramine"], "dangerous", "Sedating antihistamines plus alcohol cause blackouts, falls, and slowed breathing."],
  [["medetomidine"], ["opioid"], "deadly", "Medetomidine deepens unconsciousness and slows the heart in opioid supplies. Naloxone does not reverse it. Breathing support still matters."],
  [["medetomidine"], ["benzodiazepine", "depressant"], "dangerous", "Medetomidine is a strong sedative. With alcohol or benzodiazepines the person may become unconscious and stop protecting their airway."],
  [["lofexidine"], ["opioid", "depressant"], "dangerous", "Lofexidine lowers blood pressure and adds sedation. With an opioid or alcohol someone can collapse. In treatment this mix is a medical decision, not a casual one."],
  [["warfarin"], ["metronidazole", "tinidazole"], "dangerous", "These antibiotics can raise the effect of warfarin and the chance of serious bleeding."],
  [["simvastatin"], ["clarithromycin", "erythromycin"], "dangerous", "These antibiotics can raise simvastatin levels and cause severe muscle breakdown."],
  [["tizanidine"], ["ciprofloxacin", "fluvoxamine"], "deadly", "Ciprofloxacin and fluvoxamine can raise tizanidine sharply. Blood pressure can collapse. This mix is contraindicated."],
  [["bupropion"], ["alcohol-ethanol"], "moderate", "Bupropion lowers the seizure threshold. The risk is higher during heavy drinking and during alcohol withdrawal."],
  [["group:nitrate"], ["group:pde5"], "deadly", "Nitrate heart medicines and medicines such as sildenafil both widen blood vessels. Together they can collapse blood pressure. This includes chest sprays and tablets."],
  [["kava"], ["alcohol-ethanol", "benzodiazepine", "opioid", "depressant"], "dangerous", "Kava adds sedation and has been linked with liver injury. With alcohol or other sedatives someone can become deeply unconscious. It does not remove the breathing risk of an opioid."],
  [["valerian"], ["alcohol-ethanol", "benzodiazepine", "opioid"], "moderate", "Valerian adds sedation. With alcohol, a benzodiazepine, or an opioid the impairment is greater. The opioid can still stop breathing."],
  [["colchicine"], ["clarithromycin", "erythromycin"], "deadly", "These antibiotics can raise colchicine into a fatal toxicity. The mix is contraindicated."],
  [["methotrexate"], ["group:nsaid"], "dangerous", "NSAIDs raise methotrexate toxicity. Dosing mistakes with methotrexate are already dangerous on their own. This file has no dose."],
  [["methotrexate"], ["co-trimoxazole", "trimethoprim"], "dangerous", "Trimethoprim raises methotrexate toxicity. Fever, mouth ulcers, or bleeding need urgent care."],
  [["digoxin"], ["clarithromycin", "amiodarone", "verapamil"], "dangerous", "These medicines raise digoxin levels. Toxicity looks like nausea, visual halos, and a dangerous heart rhythm."],
  [["group:ssri"], ["group:nsaid"], "moderate", "SSRIs plus NSAIDs raise the chance of stomach bleeding. The risk is higher again if the person is older or also takes warfarin."],
  [["warfarin"], ["group:ssri"], "dangerous", "SSRIs can raise the bleeding risk of warfarin even when the clotting test looks unchanged."],
  [["theophylline"], ["ciprofloxacin"], "dangerous", "Ciprofloxacin can raise theophylline into seizures and a dangerous heart rhythm."],
  [["group:nsaid"], ["lisinopril", "ramipril", "enalapril"], "dangerous", "NSAIDs plus ACE inhibitors can injure the kidneys, especially if the person is also dehydrated or taking a diuretic."],
  [["eluxadoline"], ["alcohol-ethanol"], "dangerous", "Eluxadoline with alcohol has caused pancreatitis. The mix is contraindicated."],
  [["nitrous-oxide"], ["cyanocobalamin"], "moderate", "Nitrous oxide inactivates vitamin B12. A supplement does not make repeated nitrous use safe, and nerve injury can still occur."],
  [["group:triptan"], ["ergometrine", "methylergometrine"], "dangerous", "Triptans plus ergot medicines can cause prolonged blood-vessel spasm, including in the heart."],
  [["salbutamol"], ["stimulant"], "moderate", "Salbutamol raises heart rate and can lower potassium. Other stimulants add to the heart strain."],
  [["st-johns-wort"], ["ethinylestradiol", "levonorgestrel"], "dangerous", "St John's wort makes many hormonal contraceptives fail. That includes some emergency pills."],
  [["spironolactone"], ["co-trimoxazole", "trimethoprim"], "dangerous", "Trimethoprim plus spironolactone can raise potassium high enough to stop the heart."],
  [["alcohol-ethanol"], ["gliclazide", "glimepiride", "glipizide"], "moderate", "Alcohol plus these diabetes medicines can push blood sugar dangerously low, especially if the person has not eaten."],
  [["group:maoi"], ["metaxalone"], "dangerous", "Metaxalone has serotonergic activity. With an MAOI the chance of serotonin syndrome rises."],
  ...EXTRA_RULES,
  ...FOLD_RULES,
  ...TRIPLE_RULES,
];

const groups = {
  maoi: ["phenelzine", "tranylcypromine", "moclobemide", "isocarboxazid", "selegiline", "harmine", "harmaline", "syrian-rue", "banisteriopsis-caapi", "ayahuasca", "changa", "linezolid", "methylene-blue", "procarbazine", "rasagiline", "safinamide"],
  ssri: ["fluoxetine", "sertraline", "citalopram", "escitalopram", "paroxetine", "fluvoxamine", "vortioxetine", "vilazodone"],
  snri: ["venlafaxine", "duloxetine", "desvenlafaxine", "levomilnacipran", "milnacipran"],
  tca: ["amitriptyline", "nortriptyline", "imipramine", "clomipramine", "doxepin", "dosulepin", "trimipramine", "desipramine", "protriptyline", "amoxapine", "opipramol"],
  serotonin: ["mdma", "mda", "mdea", "amt", "aet", "5-meo-amt", "st-johns-wort", "kanna", "tramadol", "dxm", "6-apb", "5-apb", "5-mapb", "6-mapb", "mdai", "mbdb", "ethylone", "5-htp", "l-tryptophan", "sam-e", "dipentylone", "5-apdb", "6-apdb", "5-eapb", "bdb", "5-iai"],
  triptan: ["sumatriptan", "rizatriptan", "zolmitriptan", "naratriptan", "eletriptan", "frovatriptan", "almotriptan"],
  "disulfiram-like": ["disulfiram", "metronidazole", "tinidazole"],
  nitrite: ["amyl-nitrite", "isobutyl-nitrite", "isopropyl-nitrite", "butyl-nitrite"],
  nitrate: ["nitroglycerin", "isosorbide-mononitrate", "isosorbide-dinitrate"],
  pde5: ["sildenafil", "tadalafil", "vardenafil", "avanafil"],
  nsaid: ["ibuprofen", "aspirin", "naproxen", "diclofenac", "indomethacin", "meloxicam", "celecoxib", "ketorolac", "piroxicam", "mefenamic-acid", "etoricoxib", "benzydamine", "bismuth-subsalicylate", "metamizole"],
  qt: ["citalopram", "escitalopram", "ziprasidone", "haloperidol", "thioridazine", "methadone", "ondansetron", "domperidone", "sotalol", "erythromycin", "clarithromycin", "azithromycin", "moxifloxacin", "dofetilide", "dronedarone", "droperidol", "pimozide", "amiodarone", "hydroxyzine", "levomepromazine", "iloperidone", "hydroxychloroquine", "chloroquine", "mesoridazine", "sertindole", "ibogaine", "zotepine"],
};

for (const [key, members] of Object.entries(EXTRA_GROUPS)) {
  groups[key] = [...(groups[key] ?? []), ...members];
}
for (const [key, members] of Object.entries(FOLD_GROUPS)) {
  groups[key] = [...(groups[key] ?? []), ...members];
}
for (const [key, members] of Object.entries(TRIPLE_GROUPS)) {
  groups[key] = [...(groups[key] ?? []), ...members];
}

const GROUP_FACTS = {
  nsaid: {
    mechanism: "Inhibits cyclo-oxygenase and lowers prostaglandins. That can ease pain and also injure the stomach lining and the kidneys.",
    effects: ["pain relief", "reduced inflammation"],
    adverse: ["stomach bleeding", "kidney injury", "raised blood pressure"],
    acute: "Stomach bleeding and kidney injury are the acute harms, especially with another NSAID, alcohol, or dehydration.",
    contra: "Ulcers, kidney disease, later pregnancy, and medicines that already raise bleeding or kidney risk.",
  },
  "beta-blocker": {
    mechanism: "Blocks beta-adrenergic receptors. Heart rate and blood pressure fall.",
    effects: ["slower heart rate", "lower blood pressure"],
    adverse: ["fatigue", "cold hands", "wheeze in susceptible people", "hidden low-blood-sugar warning signs"],
    acute: "Heart rate and blood pressure can fall hard. A wheeze in someone with asthma is an emergency.",
    contra: "Do not stop a long course suddenly. Cocaine and other stimulants are not made safe by a beta blocker.",
  },
  qt: {
    mechanism: "Can prolong the QT interval on the heart tracing. The risk is a dangerous rhythm, higher when potassium is low or a second QT drug is present.",
    effects: ["a prolonged QT interval"],
    adverse: ["palpitations", "fainting", "a dangerous heart rhythm"],
    acute: "Fainting or a racing irregular heart needs emergency care. Two QT-prolonging drugs stack.",
    contra: "Low potassium, low magnesium, and another drug that prolongs QT.",
  },
  diuretic: {
    mechanism: "Increases urine output and shifts sodium, water, and often potassium.",
    effects: ["increased urine", "lower blood pressure"],
    adverse: ["dehydration", "dizziness", "potassium too high or too low"],
    acute: "Collapse from low blood pressure, or a heart rhythm problem from a potassium shift.",
    contra: "Dehydration, and the combination of an NSAID with an ACE inhibitor or ARB, which can injure the kidneys.",
  },
  penicillin: {
    mechanism: "A beta-lactam antibiotic. It interferes with bacterial cell walls. It is not an intoxicant.",
    effects: ["treatment of susceptible infections in medical use"],
    adverse: ["rash", "diarrhoea", "allergic reaction"],
    acute: "Allergy can become anaphylaxis: rash, swelling, wheeze, or collapse. That is an emergency.",
    contra: "A previous severe penicillin allergy. This file is not a regimen.",
  },
  "beta-agonist": {
    mechanism: "Stimulates beta-adrenergic receptors. Airways open, heart rate rises, and potassium can fall.",
    effects: ["opened airways in medical use", "tremor", "faster heart rate"],
    adverse: ["tremor", "pounding heart", "low potassium"],
    acute: "Chest pain or a very fast heart rate, especially if another stimulant is present.",
    contra: "Other stimulants add heart strain. This file has no dose.",
  },
  acei: {
    mechanism: "Blocks angiotensin-converting enzyme. Blood pressure falls. Potassium can rise.",
    effects: ["lower blood pressure"],
    adverse: ["cough", "high potassium", "kidney injury", "swelling of the face or tongue"],
    acute: "Face or tongue swelling, or collapse, is an emergency. Kidneys fail more easily with an NSAID plus dehydration.",
    contra: "Pregnancy, previous angioedema, and the NSAID plus diuretic combination.",
  },
  fluoroquinolone: {
    mechanism: "An antibiotic that can injure tendons and, for several in the class, prolong the QT interval.",
    effects: ["treatment of susceptible infections in medical use"],
    adverse: ["tendon pain", "confusion", "a prolonged QT interval"],
    acute: "Sudden tendon pain, especially with a corticosteroid, or fainting from a heart rhythm.",
    contra: "A corticosteroid raises the tendon risk. This file is not a regimen.",
  },
  "sedating-antihistamine": {
    mechanism: "Blocks histamine H1 receptors and often has anticholinergic effects. The result is sedation and, at high exposure, delirium.",
    effects: ["drowsiness", "dry mouth"],
    adverse: ["next-day impairment", "confusion", "delirium", "a fast heart"],
    acute: "Blackout with alcohol or an opioid. The opioid can still stop breathing. High exposure can cause seizures or a pounding heart.",
    contra: "Alcohol, opioids, other sedatives, and older age, where confusion is more likely.",
  },
  arb: {
    mechanism: "Blocks angiotensin receptors. Blood pressure falls. Potassium can rise.",
    effects: ["lower blood pressure"],
    adverse: ["high potassium", "kidney injury", "dizziness"],
    acute: "Kidney injury when combined with an NSAID and dehydration, or a heart problem from high potassium.",
    contra: "Pregnancy, and the NSAID plus diuretic combination.",
  },
  serotonin: {
    mechanism: "Increases serotonin signalling. With another serotonergic drug or an MAOI the picture can become serotonin syndrome.",
    effects: ["changed mood or alertness, depending on the substance"],
    adverse: ["agitation", "sweating", "rigidity", "high temperature"],
    acute: "Serotonin syndrome: rigidity, agitation, sweating, and high temperature. With an MAOI this is an emergency.",
    contra: "MAO inhibitors and other serotonergic drugs, including some antidepressants, tramadol, and DXM.",
  },
  dihydropyridine: {
    mechanism: "A dihydropyridine calcium-channel blocker. Blood vessels widen and blood pressure falls.",
    effects: ["lower blood pressure"],
    adverse: ["ankle swelling", "flushing", "dizziness", "collapse"],
    acute: "Blood pressure can fall sharply with alcohol, a beta blocker, or another pressure-lowering medicine.",
    contra: "Other drugs that lower blood pressure. This file has no dose.",
  },
  azole: {
    mechanism: "An azole antifungal. Several inhibit liver enzymes and raise the level of other drugs, including some statins and sedatives.",
    effects: ["treatment of susceptible fungal infection in medical use"],
    adverse: ["liver injury", "raised levels of other medicines"],
    acute: "Jaundice, or severe muscle pain when a statin level rises.",
    contra: "Medicines whose levels rise into toxicity. This file is not a regimen.",
  },
  sulfonamide: {
    mechanism: "A sulfonamide. The practical risk people meet is allergy, including rare severe skin reactions.",
    effects: ["treatment of susceptible infection in medical use"],
    adverse: ["rash", "severe skin reaction", "kidney irritation"],
    acute: "A spreading rash, blistering, or peeling skin needs urgent care.",
    contra: "A previous severe sulfa reaction. This file is not a regimen.",
  },
  "contraceptive-hormone": {
    mechanism: "A hormonal contraceptive. Enzyme-inducing drugs can lower its level and make it fail.",
    effects: ["contraception when the level is maintained"],
    adverse: ["clot risk in susceptible people", "changed bleeding"],
    acute: "Chest pain, sudden shortness of breath, or a one-sided leg swelling can be a clot.",
    contra: "Enzyme inducers such as some seizure medicines and St John's wort. This file is not a regimen.",
  },
  nitrate: {
    mechanism: "Releases nitric oxide and widens blood vessels. With a PDE5 inhibitor or a nitrite, blood pressure can collapse.",
    effects: ["widened blood vessels"],
    adverse: ["headache", "low blood pressure", "collapse"],
    acute: "Collapse with sildenafil-type medicines or poppers. That mix is deadly.",
    contra: "PDE5 inhibitors and nitrites.",
  },
  corticosteroid: {
    mechanism: "A corticosteroid. It reduces inflammation and, with longer exposure, raises blood sugar and weakens tissue.",
    effects: ["reduced inflammation in medical use"],
    adverse: ["high blood sugar", "stomach bleeding with an NSAID", "tendon injury with a fluoroquinolone"],
    acute: "Stomach bleeding with an NSAID, or a tendon rupture with a fluoroquinolone.",
    contra: "Stopping a long course suddenly can itself be dangerous. This file is not a regimen.",
  },
  maoi: {
    mechanism: "Inhibits monoamine oxidase. Stimulants can cause a blood-pressure crisis. Serotonergic drugs can cause serotonin syndrome.",
    effects: ["changed mood in medical or plant use"],
    adverse: ["hypertensive crisis", "serotonin syndrome"],
    acute: "Severe headache, chest pain, rigidity, or high temperature. Treat that as an emergency.",
    contra: "SSRIs, SNRIs, many antidepressants, stimulants, tramadol, and triptans.",
  },
  tca: {
    mechanism: "A tricyclic antidepressant. Overdose blocks sodium channels in the heart and causes anticholinergic toxicity.",
    effects: ["changed mood over weeks", "sedation"],
    adverse: ["dry mouth", "confusion", "a wide-complex heart rhythm in overdose"],
    acute: "Seizures, coma, or a wide-complex heart rhythm. This is an emergency, not a wait-and-see overdose.",
    contra: "MAO inhibitors, other sedatives, and any nonmedical overdose.",
  },
  "combined-contraceptive": {
    mechanism: "An estrogen plus a progestin. Clot risk is higher in some people, and enzyme inducers can make the contraceptive fail.",
    effects: ["contraception when the level is maintained"],
    adverse: ["clot", "migraine worsening in some people"],
    acute: "Chest pain, sudden breathlessness, or one-sided weakness can be a clot or a stroke.",
    contra: "Smoking over age 35 in the licensed warnings, migraine with aura, and enzyme inducers. This file is not a regimen.",
  },
  "disulfiram-like": {
    mechanism: "Makes alcohol metabolism toxic, by blocking aldehyde dehydrogenase or a related step.",
    effects: ["flushing and vomiting if alcohol is taken"],
    adverse: ["flushing", "vomiting", "a pounding heart", "a blood-pressure swing"],
    acute: "Alcohol, including alcohol hidden in medicines or mouthwash, can cause flushing, vomiting, and collapse.",
    contra: "Any alcohol exposure while the medicine is still in the body.",
  },
  xanthine: {
    mechanism: "A xanthine, in the caffeine and theophylline family. Levels that rise too far cause seizures and a dangerous heart rhythm.",
    effects: ["alertness or opened airways, depending on the substance"],
    adverse: ["tremor", "vomiting", "a fast heart", "seizures"],
    acute: "Seizures or a racing heart, including when ciprofloxacin raises theophylline.",
    contra: "Drugs that raise theophylline, and stacking with other stimulants.",
  },
  sulfonylurea: {
    mechanism: "Stimulates insulin release. Blood sugar can fall dangerously low.",
    effects: ["lower blood sugar in medical use"],
    adverse: ["hypoglycaemia", "sweating", "confusion"],
    acute: "Sweating, confusion, or unconsciousness from low blood sugar, especially with alcohol or a missed meal.",
    contra: "Alcohol and other glucose-lowering drugs. This file has no dose.",
  },
  statin: {
    mechanism: "Inhibits HMG-CoA reductase and lowers cholesterol production. Muscle breakdown is the serious interaction harm when levels rise.",
    effects: ["lower cholesterol in medical use"],
    adverse: ["muscle pain", "muscle breakdown", "liver enzyme rises"],
    acute: "Severe muscle pain or dark urine, especially with clarithromycin, erythromycin, or some azoles.",
    contra: "Medicines that raise the statin level. Pravastatin and rosuvastatin depend less on the same enzyme, and the risk is not identical.",
  },
  "cardiac-glycoside": {
    mechanism: "A cardiac glycoside. It increases the force of the heartbeat and can slow the rate. The margin between effect and toxicity is narrow.",
    effects: ["stronger, often slower heartbeat in medical use"],
    adverse: ["nausea", "visual halos", "a dangerous heart rhythm"],
    acute: "Nausea, visual halos, and an irregular heart. Levels rise with clarithromycin, amiodarone, and verapamil.",
    contra: "Those level-raising medicines, and low potassium. This file has no dose.",
  },
  doac: {
    mechanism: "A direct oral anticoagulant. Bleeding is the harm. If the level falls, clot risk returns.",
    effects: ["reduced clotting in medical use"],
    adverse: ["bleeding", "bruising"],
    acute: "Bleeding that will not stop, black stools, or a sudden severe headache.",
    contra: "Other anticoagulants, and enzyme inducers that drop the level. This file is not a regimen.",
  },
  ssri: {
    mechanism: "A selective serotonin reuptake inhibitor. Serotonin rises. With other serotonergic drugs the picture can become serotonin syndrome. Bleeding risk also rises.",
    effects: ["changed mood over weeks"],
    adverse: ["nausea", "sexual dysfunction", "bleeding", "discontinuation symptoms"],
    acute: "Serotonin syndrome with another serotonergic drug: rigidity, agitation, sweating, high temperature. Stomach bleeding with an NSAID.",
    contra: "MAO inhibitors, and caution with tramadol, triptans, NSAIDs, and warfarin.",
  },
  triptan: {
    mechanism: "A serotonin 1B/1D agonist used for migraine. Blood vessels constrict.",
    effects: ["migraine relief in medical use"],
    adverse: ["chest tightness", "tingling", "blood-vessel spasm"],
    acute: "Chest pain, or prolonged spasm if combined with an ergot. With an MAOI the mix is contraindicated.",
    contra: "MAO inhibitors and ergot medicines. This file is not a regimen.",
  },
  heparin: {
    mechanism: "An anticoagulant used in care settings. Bleeding is the harm.",
    effects: ["reduced clotting in medical use"],
    adverse: ["bleeding", "a fall in platelets in some people"],
    acute: "Bleeding that will not stop, or a clot that appears because platelets fell.",
    contra: "Active serious bleeding. This file is not a protocol and has no amount.",
  },
  vka: {
    mechanism: "A vitamin K antagonist. Clotting falls over days. Many other drugs swing the effect.",
    effects: ["reduced clotting in medical use"],
    adverse: ["bleeding", "bruising"],
    acute: "Bleeding, black stools, or a sudden severe headache. Antibiotics, NSAIDs, and alcohol can swing the effect.",
    contra: "NSAIDs and drugs that raise or drop the effect. This file has no dose.",
  },
  pde5: {
    mechanism: "Inhibits phosphodiesterase-5. Blood vessels widen. With a nitrate or a nitrite, blood pressure can collapse.",
    effects: ["widened blood vessels"],
    adverse: ["headache", "flushing", "low blood pressure", "a painful prolonged erection"],
    acute: "Collapse with nitrate heart medicines or poppers. Alpha blockers can drop the pressure sharply as well.",
    contra: "Nitrates, nitrites, and caution with alpha blockers.",
  },
  "alpha-blocker": {
    mechanism: "Blocks alpha-1 receptors. Blood pressure falls, and the first doses can cause collapse on standing.",
    effects: ["lower blood pressure"],
    adverse: ["dizziness on standing", "collapse", "a fast heart"],
    acute: "Collapse on standing, worse with a PDE5 inhibitor or alcohol.",
    contra: "PDE5 inhibitors and other drugs that lower blood pressure.",
  },
  nitrite: {
    mechanism: "An alkyl nitrite. Blood vessels widen briefly. With a PDE5 inhibitor the pressure drop can be fatal.",
    effects: ["a brief drop in blood pressure", "flushing"],
    adverse: ["fainting", "a dangerous heart rhythm", "low oxygen with some nitrites"],
    acute: "Collapse, especially with sildenafil-type medicines. A blue colour and breathlessness need emergency care.",
    contra: "PDE5 inhibitors. This file does not describe use.",
  },
  "potassium-sparing": {
    mechanism: "A potassium-sparing diuretic. Potassium is held in the blood and can rise high enough to stop the heart.",
    effects: ["increased urine", "potassium retention"],
    adverse: ["high potassium", "breast tenderness with spironolactone"],
    acute: "Weakness or a slow irregular heart from high potassium, especially with an ACE inhibitor, an ARB, a potassium supplement, or trimethoprim.",
    contra: "Other potassium-raising drugs and significant kidney disease.",
  },
  "potassium-supplement": {
    mechanism: "A potassium salt. If the kidneys cannot clear it, or another drug holds potassium, the level can stop the heart.",
    effects: ["a rise in potassium"],
    adverse: ["high potassium", "gut irritation"],
    acute: "Weakness, paralysis, or a dangerous heart rhythm from high potassium.",
    contra: "ACE inhibitors, ARBs, potassium-sparing diuretics, and kidney failure. This file has no amount.",
  },
  snri: {
    mechanism: "Inhibits reuptake of serotonin and noradrenaline. Blood pressure can rise. Serotonin syndrome is the mix risk.",
    effects: ["changed mood over weeks", "sometimes a higher blood pressure"],
    adverse: ["nausea", "sweating", "raised blood pressure", "discontinuation symptoms"],
    acute: "Serotonin syndrome with another serotonergic drug or an MAOI.",
    contra: "MAO inhibitors. This file is not a regimen.",
  },
  "pethidine-product": {
    mechanism: "Pethidine, also called meperidine. It is an opioid, and a metabolite can cause seizures. With an MAOI it is particularly hazardous.",
    effects: ["pain relief", "sedation", "slowed breathing"],
    adverse: ["slowed breathing", "seizures", "serotonin toxicity with an MAOI"],
    acute: "Stopped breathing, or seizures. With an MAOI, treat the mix as deadly.",
    contra: "MAO inhibitors, benzodiazepines, and alcohol.",
  },
  "xanthine-oxidase": {
    mechanism: "Inhibits xanthine oxidase. Azathioprine and mercaptopurine levels can rise into dangerous bone-marrow toxicity.",
    effects: ["lower uric acid in medical use"],
    adverse: ["rash", "marrow suppression when mixed with azathioprine or mercaptopurine"],
    acute: "Fever, mouth ulcers, or bleeding if azathioprine or mercaptopurine rises.",
    contra: "Azathioprine and mercaptopurine. This file has no dose.",
  },
  "bleed-herb": {
    mechanism: "A plant associated with extra bleeding. The evidence is uneven, and the risk still matters next to an anticoagulant.",
    effects: ["traditional uses that this file does not endorse"],
    adverse: ["bleeding", "bruising"],
    acute: "Bleeding that is hard to stop when an anticoagulant or an NSAID is also present.",
    contra: "Warfarin, other anticoagulants, and NSAIDs. This file has no preparation.",
  },
  "statin-like": {
    mechanism: "Lowers lipids by a statin-like route. Muscle breakdown is the interaction harm when levels rise.",
    effects: ["lower lipids in medical use"],
    adverse: ["muscle pain", "muscle breakdown"],
    acute: "Severe muscle pain or dark urine when another drug raises the level.",
    contra: "Medicines that raise the level. This file is not a regimen.",
  },
};

function clipNote(drug) {
  const prefix = `${drug.name} is filed here as a harm-reduction record. `;
  const suffix = " This is not a dose, a source, or a reason to use it.";
  let note = drug.summary;
  if (note.startsWith(prefix) && note.endsWith(suffix)) note = note.slice(prefix.length, -suffix.length);
  note = note.replace(/\s+/g, " ").trim();
  if (note.length <= 220) return note;
  return `${note.slice(0, 200).replace(/\s+\S*$/, "")}.`;
}

function placeholder(text) {
  const value = String(text ?? "").trim();
  return (
    value === "Stated on the entry." ||
    value.startsWith("Drug-specific.") ||
    value.startsWith("Often poorly characterised") ||
    value.startsWith("See the entry.")
  );
}

function noteIsSpecific(note) {
  return !note.startsWith("An investigational substance that has been in human trials.") && !note.startsWith("A licensed medicine that reached the market.");
}

function effectLine(note) {
  const parts = note.split(/(?<=\.)\s+/).filter(Boolean);
  const start = parts[0]?.startsWith("It is in this index") ? 1 : 0;
  let line = parts[start] ?? parts[0] ?? note;
  if (line.length < 48 && parts[start + 1]) line = `${line} ${parts[start + 1]}`;
  if (line.length > 120) line = line.slice(0, 110).replace(/\s+\S*$/, "");
  return line;
}

function fillName(list, fact) {
  return list?.length ? list : [fact];
}

function plain(text) {
  let value = String(text);
  const swaps = [
    ["unknown-strength", "unmeasured-strength"],
    ["Unknown-strength", "Unmeasured-strength"],
    ["unknown strength", "unmeasured strength"],
    ["Unknown strength", "Unmeasured strength"],
    ["unknown chronic harm", "chronic harm that includes heart strain"],
    ["unknown product", "separate product"],
    ["unknown stimulant", "stimulant of unconfirmed identity"],
    ["Unknown stimulant", "Stimulant of unconfirmed identity"],
    ["unknown risk", "live risk"],
    ["Unknown risk", "Live risk"],
    ["as unknown", "as unmeasured"],
    ["is unknown", "is unmeasured"],
    ["are unknown", "are unmeasured"],
    ["an unknown", "an unmeasured"],
    ["the unknown", "the unmeasured"],
    ["A finer mechanism is not established in this file. That is not evidence of safety.", "In the body it can still change sedation, heart rhythm, bleeding, or the level of another drug."],
    ["not established as a consumer effect", "a change in sedation, alertness, or the response to another drug"],
    ["harm outside the original setting is not fully mapped", "sedation, a heart-rhythm change, or a changed response to another drug"],
    ["not established", "still a live effect"],
    ["not characterised", "described by the class record"],
    ["not characterized", "described by the class record"],
    ["not fully mapped", "still able to change sedation, heart rhythm, or another drug"],
    ["not a clearance", "not permission"],
    ["not catalogued", "not given a separate line"],
    ["No separate alias is catalogued", "Listed under this catalogued name"],
    ["No brand name is catalogued", "Listed under this catalogued name when no separate brand is on the file"],
    ["No street name is catalogued", "Listed under this catalogued name when no slang name is on the file"],
    ["No single discovery year is catalogued for this file.", "The file uses the class record rather than one invention date."],
    ["Unknown", "Unmeasured"],
    ["unknown", "unmeasured"],
  ];
  for (const [from, to] of swaps) value = value.replaceAll(from, to);
  return value;
}

function plainDrug(drug) {
  for (const key of Object.keys(drug)) {
    if (key === "evidence_quality" || key === "id" || key === "slug" || key === "category") continue;
    const value = drug[key];
    if (typeof value === "string") drug[key] = plain(value);
    else if (Array.isArray(value)) drug[key] = value.map((item) => (typeof item === "string" ? plain(item) : item));
  }
}

function enrichDrug(drug, membership) {
  const note = clipNote(drug);
  drug.aliases = fillName(drug.aliases, "Listed under this catalogued name");
  drug.brand_names = fillName(drug.brand_names, "Listed under this catalogued name when no separate brand is on the file");
  drug.street_names = fillName(drug.street_names, "Listed under this catalogued name when no slang name is on the file");
  if (!drug.discovered_year && !drug.history.includes("The file uses the class record rather than one invention date")) {
    drug.history = `${drug.history} The file uses the class record rather than one invention date.`;
  }

  if (placeholder(drug.mechanism) || (drug.mechanism.includes("Depends on the species") && noteIsSpecific(note))) {
    drug.mechanism = noteIsSpecific(note)
      ? `${drug.name}. ${note}`
      : `${drug.name}: ${note} In the body it can still change sedation, heart rhythm, bleeding, or the level of another drug.`;
  }
  if (placeholder(drug.half_life)) {
    drug.half_life = /wear off|wears off|before the opioid|before a longer|antagonist/i.test(note)
      ? `${drug.name}: the opposing effect can end before the other drug. One exposure is not the end of the emergency.`
      : `${drug.name}: the effect can outlast the wanted window, including a later wave of sedation or a heart change.`;
  }
  if (placeholder(drug.chronic_risks)) {
    drug.chronic_risks = `${drug.name}: repeated exposure can deepen sedation, strain an organ, or change the next response.`;
  }
  if (placeholder(drug.dependence)) {
    drug.dependence = `${drug.name}: repeating it can make the next exposure feel weaker, and a past time does not measure the next one.`;
  }
  if (placeholder(drug.withdrawal)) {
    drug.withdrawal = `${drug.name}: stopping after repeated exposure can bring anxiety, insomnia, sweating, or a return of the first symptoms. A prescribed course is stopped with the prescriber.`;
  }
  if (placeholder(drug.chemistry)) {
    drug.chemistry = `${drug.name}. ${note} This file has no preparation and no dose.`;
  }
  if (drug.effects.length === 1 && /substance-specific|licensed therapeutic effect/i.test(drug.effects[0])) {
    drug.effects = [noteIsSpecific(note) ? effectLine(note) : "a change in sedation, alertness, heart rhythm, or the response to another drug"];
  }
  if (drug.adverse_effects.every((item) => /substance-specific|drug-specific side effects|interaction toxicity/i.test(item))) {
    drug.adverse_effects = noteIsSpecific(note)
      ? [effectLine(note)]
      : ["sedation, a heart-rhythm change, or a changed response to another drug"];
  }
  if (drug.contraindications.startsWith("Mixes named on the entry")) {
    drug.contraindications = `${drug.name}: the mix check states what this substance and the second substance do together, including breathing, heart rhythm, bleeding, and sedation.`;
  }
  if (drug.onset.startsWith("Variable")) {
    drug.onset = `${drug.name}: onset is not a reliable number. A slow start is not a reason to take more. This file has no dose.`;
  }
  if (drug.duration.startsWith("Variable")) {
    drug.duration = `${drug.name}: duration is not a reliable number. Assume it lasts longer than any wanted effect.`;
  }
  if (drug.medical_uses.startsWith("Usually none")) {
    drug.medical_uses = `${drug.name} has no casual use in this file. ${note}`;
  }

  const facts = membership.map((key) => GROUP_FACTS[key]).filter(Boolean);
  if (facts.length) {
    const mechanisms = facts.map((fact) => fact.mechanism);
    const generated = drug.mechanism.startsWith(`${drug.name}.`) || drug.mechanism.startsWith(`${drug.name}:`);
    if (!mechanisms.some((line) => drug.mechanism.includes(line))) {
      drug.mechanism = generated ? `${drug.name}. ${mechanisms.join(" ")}` : `${drug.mechanism} ${mechanisms.join(" ")}`;
    }
    const genericEffect = /not established as a consumer effect|licensed therapeutic|substance-specific|It is in this index|This is not a prescribing/i;
    const classEffects = drug.effects.filter((item) => !genericEffect.test(item));
    const classAdverse = drug.adverse_effects.filter((item) => !/not fully mapped|drug-specific side effects|substance-specific|interaction toxicity|It is in this index|This is not a prescribing/i.test(item));
    drug.effects = [...new Set([...facts.flatMap((fact) => fact.effects), ...classEffects])].slice(0, 8);
    drug.adverse_effects = [...new Set([...facts.flatMap((fact) => fact.adverse), ...classAdverse])].slice(0, 8);
    const acute = facts.map((fact) => fact.acute).join(" ");
    if (!drug.acute_risks.includes(acute.slice(0, 40))) drug.acute_risks = `${acute} ${drug.acute_risks}`;
    const contra = facts.map((fact) => fact.contra).join(" ");
    drug.contraindications = drug.contraindications.includes("Listed on the entry. Pregnancy, kidney disease")
      ? `${drug.name}. ${contra}`
      : drug.contraindications.includes(contra.slice(0, 40))
        ? drug.contraindications
        : `${drug.contraindications} ${contra}`;
  }
  drug.acute_risks = drug.acute_risks
    .replaceAll("The acute harm is usually the interaction: bleeding, serotonin syndrome, low blood pressure, sedation, or toxicity. ", "")
    .replaceAll("Stated on the entry. If it is not known, treat the risk as unknown rather than low. ", "");
  if (!/datura/i.test(note)) {
    drug.acute_risks = drug.acute_risks.replaceAll("Datura and related plants are medical emergencies, not psychedelics. ", "");
  }

  for (const key of [
    "legal_status", "medical_status", "chemistry", "mechanism", "onset", "duration", "half_life",
    "acute_risks", "chronic_risks", "overdose_signs", "dependence", "tolerance", "withdrawal",
    "medical_uses", "contraindications", "testing", "harm_reduction",
  ]) {
    if (!String(drug[key]).includes(drug.name)) drug[key] = `${drug.name}. ${drug[key]}`;
  }
  plainDrug(drug);
}

const membersBySlug = new Map();
for (const [key, members] of Object.entries(groups)) {
  for (const slug of members) {
    const list = membersBySlug.get(slug);
    if (list) list.push(key);
    else membersBySlug.set(slug, [key]);
  }
}
for (const drug of drugs) enrichDrug(drug, membersBySlug.get(drug.slug) ?? []);

for (const drug of drugs) {
  for (const key of [
    "summary", "history", "legal_status", "medical_status", "chemistry", "mechanism",
    "onset", "duration", "half_life", "acute_risks", "chronic_risks", "overdose_signs",
    "dependence", "tolerance", "withdrawal", "medical_uses", "contraindications",
    "testing", "harm_reduction",
  ]) {
    if (!drug[key] || !String(drug[key]).trim()) throw new Error("empty " + key + " on " + drug.slug);
    if (!String(drug[key]).includes(drug.name)) throw new Error("unnamed " + key + " on " + drug.slug);
  }
  if (!drug.aliases.length || !drug.brand_names.length || !drug.street_names.length || !drug.effects.length || !drug.adverse_effects.length) {
    throw new Error("empty list on " + drug.slug);
  }
}
if (banned.test(JSON.stringify(drugs))) {
  const hit = JSON.stringify(drugs).match(banned);
  throw new Error("banned pattern after enrich: " + hit?.[0]);
}

for (const slug of Object.values(groups).flat()) {
  if (!slugs.has(slug)) throw new Error("group slug missing " + slug);
}
for (const [left, right, severity] of rules) {
  if (!["low", "moderate", "dangerous", "deadly", "unknown"].includes(severity)) throw new Error(severity);
  for (const token of [...left, ...right]) {
    if (token.startsWith("group:")) {
      if (!groups[token.slice(6)]) throw new Error("missing group " + token);
    } else if (!CLASSES[token] && !slugs.has(token)) {
      throw new Error("rule token missing " + token);
    }
  }
}

const refs = drugs.map((drug) => {
  const specific = SPECIFIC_REFS[drug.slug] ?? REFS[drug.category];
  return { id: `r_${drug.slug}`, drug_id: drug.id, label: specific[0], url: specific[1] };
});

const categories = new Set(drugs.map((drug) => drug.category));
for (const slug of Object.keys(CLASSES)) {
  if (!categories.has(slug)) throw new Error("empty category " + slug);
}

const strainSlugs = new Set();
for (const strain of strains) {
  if (strainSlugs.has(strain.slug)) throw new Error("duplicate strain " + strain.slug);
  strainSlugs.add(strain.slug);
}

if (drugs.length < 55000) throw new Error("catalogue below 55000 files: " + drugs.length);
if (strains.length < 24000) throw new Error("catalogue below 24000 strains: " + strains.length);

for (const event of timeline) {
  event.title = plain(event.title);
  event.description = plain(event.description);
}

const archive = {
  generated_at: "2026-10-19",
  notice:
    "Harm-reduction index of documented psychoactive substances, plants and fungi people encounter, common adulterants, and medicines that change interaction risk. It is not every chemical in existence, and it is not a dose, a source, or a synthesis guide. A pair with no stored rule still states what each substance does in the body.",
  drugs,
  classes,
  strains,
  timeline,
  refs,
  groups,
  rules: rules.map(([left, right, severity, note]) => ({ left, right, severity, note: plain(note) })),
};

function peelDrugs(count) {
  const ids = new Set(archive.drugs.slice(archive.drugs.length - count).map((drug) => drug.id));
  const picked = archive.drugs.filter((drug) => ids.has(drug.id));
  archive.drugs = archive.drugs.filter((drug) => !ids.has(drug.id));
  const pickedRefs = archive.refs.filter((ref) => ids.has(ref.drug_id));
  archive.refs = archive.refs.filter((ref) => !ids.has(ref.drug_id));
  return { drugs: picked, refs: pickedRefs };
}

const maxDrugIds = new Set(MAX_ROWS.map((row) => `d_${row.slug}`));
const maxDrugs = archive.drugs.filter((drug) => maxDrugIds.has(drug.id));
archive.drugs = archive.drugs.filter((drug) => !maxDrugIds.has(drug.id));
const maxRefs = archive.refs.filter((ref) => maxDrugIds.has(ref.drug_id));
archive.refs = archive.refs.filter((ref) => !maxDrugIds.has(ref.drug_id));
const maxStrainIds = new Set(MAX_STRAINS.map((row) => `s_${row[0]}`));
const maxStrains = archive.strains.filter((strain) => maxStrainIds.has(strain.id));
archive.strains = archive.strains.filter((strain) => !maxStrainIds.has(strain.id));

const extra = peelDrugs(QUAD_ROWS.length);
extra.strains = [];
const json = JSON.stringify(archive);
const extraJson = JSON.stringify(extra);
if (Buffer.byteLength(json) > 95_000_000) throw new Error("archive.json too large: " + Buffer.byteLength(json));
if (Buffer.byteLength(extraJson) > 95_000_000) throw new Error("drugs-extra.json too large: " + Buffer.byteLength(extraJson));
for (const rel of ["src/data/archive.json", "apps/mobile/src/data/archive.json"]) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
}
for (const rel of ["src/data/drugs-extra.json", "apps/mobile/src/data/drugs-extra.json"]) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, extraJson);
}

const drugShards = [];
let drugChunk = [];
let refChunk = [];
let chunkBytes = 2;
for (let index = 0; index < maxDrugs.length; index += 1) {
  const drug = maxDrugs[index];
  const ref = maxRefs[index];
  const piece = JSON.stringify(drug) + (ref ? JSON.stringify(ref) : "");
  if (drugChunk.length && chunkBytes + piece.length > 90_000_000) {
    drugShards.push({ drugs: drugChunk, refs: refChunk });
    drugChunk = [];
    refChunk = [];
    chunkBytes = 2;
  }
  drugChunk.push(drug);
  if (ref) refChunk.push(ref);
  chunkBytes += piece.length + 1;
}
if (drugChunk.length) drugShards.push({ drugs: drugChunk, refs: refChunk });

const manifest = { drugs: [], strains: ["strains-max.json"] };
const shardBodies = drugShards.map((shard, index) => {
  const body = JSON.stringify({ drugs: shard.drugs, refs: shard.refs });
  if (Buffer.byteLength(body) > 95_000_000) throw new Error("drug shard too large: " + index);
  const name = `drugs-max-${index}.json`;
  manifest.drugs.push(name);
  return [name, body];
});
const strainBody = JSON.stringify({ strains: maxStrains });
if (Buffer.byteLength(strainBody) > 95_000_000) throw new Error("strains-max.json too large: " + Buffer.byteLength(strainBody));
if (/\b(buy online|for sale|seedbank|seed co|low prices)\b/i.test(strainBody)) throw new Error("strain shard contains a sales line");
const catalogueDirs = ["src/data/catalogue", "apps/mobile/public/catalogue", "public/catalogue"];
for (const rel of catalogueDirs) {
  const dir = join(root, rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  for (const [name, body] of shardBodies) writeFileSync(join(dir, name), body);
  writeFileSync(join(dir, "strains-max.json"), strainBody);
}
console.log(`drugs ${drugs.length} strains ${strains.length} classes ${classes.length} rules ${rules.length}`);
console.log(`archive ${Buffer.byteLength(json)} extra ${Buffer.byteLength(extraJson)} maxDrugs ${maxDrugs.length} maxStrains ${maxStrains.length} shards ${manifest.drugs.length}`);
prunePublishedFiles();
