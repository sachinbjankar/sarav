// English grammar & vocabulary (explanations in Marathi)
import { tbl, fromTable, qa } from '../engine.js';

const S = 'english';

const SYN = `
big | large, huge, enormous
small | little, tiny, minute
happy | glad, joyful, cheerful
sad | unhappy, sorrowful, gloomy
brave | courageous, bold, fearless
fast | quick, rapid, swift
begin | start, commence
end | finish, conclude
help | assist, aid
answer | reply, respond
buy | purchase
rich | wealthy, affluent
poor | needy, penniless
beautiful | pretty, lovely, attractive
clever | intelligent, smart, bright
angry | furious, irate, mad
easy | simple, effortless
difficult | hard, tough
honest | truthful, sincere
famous | renowned, well-known, celebrated
ancient | old, antique
modern | new, contemporary
calm | quiet, peaceful, tranquil
danger | risk, peril, hazard
enemy | foe, opponent, adversary
friend | companion, comrade, pal
gift | present, donation
journey | trip, voyage, tour
idea | thought, notion, concept
mistake | error, fault, blunder
victory | win, triumph, success
weak | feeble, frail
strong | powerful, mighty, sturdy
dirty | filthy, unclean
clean | spotless, tidy
shy | timid, bashful
lazy | idle, sluggish
abandon | leave, desert, forsake
admire | praise, appreciate
anxious | worried, uneasy, nervous
brief | short, concise
cautious | careful, wary
eager | keen, enthusiastic
humble | modest, meek
obey | follow, comply
reveal | disclose, expose
rude | impolite, discourteous
vacant | empty, unoccupied
`;

const ANT = `
accept | reject
ancient | modern
arrive | depart
artificial | natural
ascend | descend
asleep | awake
attack | defend
beautiful | ugly
borrow | lend
bright | dull
brave | cowardly
cheap | expensive
clever | foolish
cruel | kind
deep | shallow
difficult | easy
early | late
encourage | discourage
enemy | friend
expand | contract
export | import
fail | pass
famous | unknown
forget | remember
generous | miserly
guilty | innocent
honest | dishonest
humble | proud
include | exclude
increase | decrease
inferior | superior
interior | exterior
victory | defeat
loss | profit
major | minor
maximum | minimum
narrow | wide
natural | artificial
obey | disobey
optimist | pessimist
permanent | temporary
polite | rude
poverty | wealth
present | absent
public | private
punish | reward
rare | common
rough | smooth
safe | dangerous
seldom | often
shallow | deep
sharp | blunt
strong | weak
success | failure
thick | thin
tight | loose
top | bottom
true | false
visible | invisible
wise | foolish
`;

const VERB = tbl(`
go | went | gone
come | came | come
eat | ate | eaten
write | wrote | written
speak | spoke | spoken
take | took | taken
give | gave | given
see | saw | seen
begin | began | begun
break | broke | broken
bring | brought | brought
buy | bought | bought
catch | caught | caught
choose | chose | chosen
do | did | done
draw | drew | drawn
drink | drank | drunk
drive | drove | driven
fall | fell | fallen
fly | flew | flown
forget | forgot | forgotten
freeze | froze | frozen
get | got | got
grow | grew | grown
hide | hid | hidden
know | knew | known
lie (to rest) | lay | lain
lay | laid | laid
ride | rode | ridden
ring | rang | rung
rise | rose | risen
run | ran | run
sing | sang | sung
sink | sank | sunk
steal | stole | stolen
swim | swam | swum
teach | taught | taught
tear | tore | torn
think | thought | thought
throw | threw | thrown
wake | woke | woken
wear | wore | worn
win | won | won
fight | fought | fought
sell | sold | sold
tell | told | told
shake | shook | shaken
show | showed | shown
blow | blew | blown
bite | bit | bitten
`, ['base', 'past', 'pp']);

const PLURAL = tbl(`
child | children
man | men
woman | women
tooth | teeth
foot | feet
mouse | mice
goose | geese
ox | oxen
sheep | sheep
deer | deer
knife | knives
leaf | leaves
wife | wives
half | halves
wolf | wolves
city | cities
baby | babies
potato | potatoes
tomato | tomatoes
hero | heroes
box | boxes
bus | buses
crisis | crises
analysis | analyses
criterion | criteria
phenomenon | phenomena
datum | data
cactus | cacti
`, ['s', 'p']);

const ONEW = tbl(`
A person who writes poems | poet
A person who writes books | author
A place where books are kept for reading | library
A place where scientific experiments are done | laboratory
A place where old objects are displayed | museum
A person who cannot read or write | illiterate
One who does not believe in God | atheist
One who believes in God | theist
A person who eats only plants | vegetarian
Animals that eat flesh | carnivores
Animals that eat plants | herbivores
A medicine to counter poison | antidote
A speech delivered without preparation | extempore
A person who leaves his country to live in another | emigrant
A person who comes into a country to live | immigrant
Life story of a person written by himself | autobiography
Life story of a person written by another | biography
A period of ten years | decade
A period of hundred years | century
A period of thousand years | millennium
A person who is present at an event and sees it | eyewitness
One who cannot be defeated | invincible
That which cannot be read | illegible
That which cannot be seen | invisible
That which cannot be avoided | inevitable
A person who knows everything | omniscient
Fear of water | hydrophobia
A government by the people | democracy
Rule by a king or queen | monarchy
A person who looks at the bright side of things | optimist
A person who looks at the dark side of things | pessimist
A doctor who treats children | paediatrician
A doctor who treats eye diseases | ophthalmologist
A doctor who treats skin diseases | dermatologist
A doctor who treats heart diseases | cardiologist
One who walks on foot | pedestrian
One who spends very little money | miser
One who spends money carelessly | spendthrift
A list of items to be discussed at a meeting | agenda
A person who works without salary | volunteer
`, ['def', 'w']);

const SPELL = `
necessary | neccessary, necesary, neccesary
accommodate | accomodate, acommodate, accommadate
receive | recieve, receeve, riceive
separate | seperate, separete, saparate
government | goverment, governmant, govermant
environment | enviroment, environmant, envirnment
occasion | ocassion, occassion, ocasion
definitely | definately, definitly, defenitely
beginning | begining, beggining, beginnig
believe | beleive, belive, beleeve
committee | commitee, comittee, commitie
embarrass | embarass, embaras, embbarass
February | Febuary, Februry, Febrauary
guarantee | garantee, guarentee, gaurantee
independent | independant, indipendent, independint
knowledge | knowlege, knowladge, nowledge
library | libary, liberary, librery
maintenance | maintainance, maintenence, maintanance
occurrence | occurence, ocurrence, occurance
privilege | priviledge, privilage, previlege
restaurant | restaraunt, restaurent, resturant
successful | succesful, sucessful, successfull
tomorrow | tommorow, tomorow, tommorrow
village | vilage, villege, villag
weather | wether, wheather, weathar
`;

const IDIOMS = tbl(`
a piece of cake | very easy
break the ice | to start a conversation
once in a blue moon | very rarely
hit the nail on the head | to say exactly the right thing
let the cat out of the bag | to reveal a secret
under the weather | feeling slightly ill
burn the midnight oil | to work late into the night
spill the beans | to disclose a secret too early
a blessing in disguise | something good that first seemed bad
call it a day | to stop working for the day
cry over spilt milk | to regret what cannot be changed
in hot water | in trouble
cold feet | nervousness before an important event
apple of one's eye | someone very dear
at the eleventh hour | at the last moment
bite the bullet | to face a difficult situation bravely
by leaps and bounds | very rapidly
hand in glove | very close partners (often in wrongdoing)
add fuel to the fire | to make a bad situation worse
red-letter day | a memorable day
`, ['id', 'mean']);

const GENDER = tbl(`
king | queen
prince | princess
actor | actress
hero | heroine
lion | lioness
tiger | tigress
horse | mare
dog | bitch
bull | cow
cock | hen
nephew | niece
husband | wife
monk | nun
uncle | aunt
emperor | empress
host | hostess
landlord | landlady
widower | widow
bridegroom | bride
duke | duchess
`, ['m', 'f']);

function synRows() {
  const rows = [];
  for (const line of SYN.trim().split('\n')) {
    const [head, rest] = line.split('|').map((x) => x.trim());
    const g = [head, ...rest.split(',').map((x) => x.trim())];
    for (const a of g) for (const b of g) if (a !== b) rows.push({ a, b, g: g.join(', ') });
  }
  return rows;
}
const antRows = () => ANT.trim().split('\n').flatMap((l) => { const [a, b] = l.split('|').map((x) => x.trim()); return [{ a, b }, { a: b, b: a }]; });

export function genEnglish() {
  const spell = SPELL.trim().split('\n').map((l) => { const [w, wr] = l.split('|').map((x) => x.trim()); return { w, wr: wr.split(',').map((x) => x.trim()) }; });
  return [
    ...fromTable(S, synRows(), { from: 'a', to: 'b', q: (x) => `Choose the synonym of ‘${x.a}’.`, e: (x) => `समानार्थी शब्द: ${x.g}.` }),
    ...fromTable(S, antRows(), { from: 'a', to: 'b', q: (x) => `Choose the antonym of ‘${x.a}’.`, e: (x) => `${x.a} × ${x.b}.` }),
    ...fromTable(S, VERB, { from: 'base', to: 'past', q: (x) => `What is the past tense of ‘${x.base}’?`, e: (x) => `${x.base} – ${x.past} – ${x.pp}.` }),
    ...fromTable(S, VERB, { from: 'base', to: 'pp', seed: 'pp', q: (x) => `What is the past participle (V3) of ‘${x.base}’?`, e: (x) => `${x.base} – ${x.past} – ${x.pp}.` }),
    ...VERB.filter((v) => v.past !== v.pp && !v.base.includes('(')).map((v) => ({ s: S, q: `She has ___ (${v.base}).`, o: [v.pp, v.past, v.base.endsWith('e') ? `${v.base}d` : `${v.base}ed`, v.base.endsWith('e') ? `${v.base.slice(0, -1)}ing` : `${v.base}ing`], e: `Present perfect (has/have) नंतर V3 वापरतात: ${v.pp}.` })),
    ...PLURAL.map((p) => ({ s: S, q: `What is the plural of ‘${p.s}’?`, o: [p.p, ...[`${p.s}s`, `${p.s}es`, `${p.p}s`].filter((x) => x !== p.p)].slice(0, 4), e: `${p.s} → ${p.p}.` })).filter((x) => new Set(x.o).size === 4),
    ...fromTable(S, ONEW, { from: 'def', to: 'w', q: (x) => `One word for: ‘${x.def}’`, e: (x) => `${x.def} = ${x.w}.` }),
    ...spell.map((x, i) => ({ s: S, q: `Choose the correctly spelt word. (${i + 1})`, o: [x.w, ...x.wr], e: `बरोबर स्पेलिंग: ${x.w}.` })),
    ...fromTable(S, IDIOMS, { from: 'id', to: 'mean', q: (x) => `What is the meaning of the idiom ‘${x.id}’?`, e: (x) => `${x.id} = ${x.mean}.` }),
    ...fromTable(S, GENDER, { from: 'm', to: 'f', q: (x) => `What is the feminine gender of ‘${x.m}’?`, e: (x) => `${x.m} → ${x.f}.` }),
    ...qa(S, [
      ['Fill in the blank: She ___ to school every day.', 'goes', 'go', 'going', 'gone', 'He/She/It सोबत simple present मध्ये क्रियापदाला -s/-es लागतो.'],
      ['Fill in the blank: ___ apple a day keeps the doctor away.', 'An', 'A', 'The', 'No article', 'स्वराने सुरू होणाऱ्या उच्चारापूर्वी ‘an’.'],
      ['Fill in the blank: He is ___ honest man.', 'an', 'a', 'the', 'no article', '‘honest’ चा उच्चार ‘ऑनेस्ट’ (स्वर) असल्याने ‘an’.'],
      ['Fill in the blank: She is ___ university student.', 'a', 'an', 'the', 'no article', '‘university’ चा उच्चार ‘यु’ (व्यंजन ध्वनी) असल्याने ‘a’.'],
      ['Fill in the blank: ___ Ganga is a holy river.', 'The', 'A', 'An', 'No article', 'नद्या, समुद्र, पर्वतरांगा यांच्या नावापूर्वी ‘the’.'],
      ['Fill in the blank: They have been living here ___ 2015.', 'since', 'for', 'from', 'by', 'ठराविक वेळबिंदूसाठी ‘since’; कालावधीसाठी ‘for’.'],
      ['Fill in the blank: I have been waiting ___ two hours.', 'for', 'since', 'from', 'by', 'कालावधी (two hours) साठी ‘for’.'],
      ['Fill in the blank: The book is ___ the table.', 'on', 'in', 'at', 'into', 'पृष्ठभागावर असलेल्या वस्तूसाठी ‘on’.'],
      ['Fill in the blank: He was born ___ 1990.', 'in', 'on', 'at', 'by', 'वर्ष/महिन्यासाठी ‘in’.'],
      ['Fill in the blank: The train arrives ___ 5 o’clock.', 'at', 'in', 'on', 'by', 'ठराविक वेळेसाठी ‘at’.'],
      ['Fill in the blank: My birthday is ___ Monday.', 'on', 'in', 'at', 'by', 'दिवस/तारखेसाठी ‘on’.'],
      ['Fill in the blank: He is good ___ mathematics.', 'at', 'in', 'on', 'for', '‘good at’ हा योग्य वाक्प्रयोग.'],
      ['Fill in the blank: She is afraid ___ dogs.', 'of', 'from', 'with', 'by', '‘afraid of’ हा योग्य वाक्प्रयोग.'],
      ['Fill in the blank: Neither Ravi nor his friends ___ present.', 'were', 'was', 'is', 'has', 'Neither…nor मध्ये क्रियापद जवळच्या कर्त्यानुसार (friends) अनेकवचनी.'],
      ['Fill in the blank: Each of the boys ___ a prize.', 'gets', 'get', 'are getting', 'have got', '‘Each’ सोबत एकवचनी क्रियापद.'],
      ['Fill in the blank: If it rains, we ___ at home.', 'will stay', 'stayed', 'would stayed', 'staying', 'First conditional: If + present, will + verb.'],
      ['Fill in the blank: If I were a bird, I ___ fly.', 'would', 'will', 'shall', 'can', 'काल्पनिक स्थिती: If I were…, would + verb.'],
      ['Choose the correct question tag: You are coming, ___?', 'aren’t you', 'are you', 'isn’t it', 'don’t you', 'होकारार्थी वाक्याला नकारार्थी tag.'],
      ['Choose the correct question tag: He doesn’t smoke, ___?', 'does he', 'doesn’t he', 'is he', 'did he', 'नकारार्थी वाक्याला होकारार्थी tag.'],
      ['Choose the correct question tag: Let’s go for a walk, ___?', 'shall we', 'will we', 'don’t we', 'let we', '‘Let’s’ ने सुरू होणाऱ्या वाक्याला ‘shall we?’'],
      ['Change into passive voice: Ram writes a letter.', 'A letter is written by Ram.', 'A letter was written by Ram.', 'A letter is wrote by Ram.', 'A letter has written by Ram.', 'Simple present passive: is/are + V3.'],
      ['Change into passive voice: She sang a song.', 'A song was sung by her.', 'A song is sung by her.', 'A song was sang by her.', 'A song has been sung by her.', 'Simple past passive: was/were + V3.'],
      ['Change into passive voice: They are building a house.', 'A house is being built by them.', 'A house is built by them.', 'A house was being built by them.', 'A house has been built by them.', 'Present continuous passive: is/are being + V3.'],
      ['Change into indirect speech: He said, “I am tired.”', 'He said that he was tired.', 'He said that I am tired.', 'He said that he is tired.', 'He told that he was tired.', 'Reporting verb past असल्यास am → was, I → he.'],
      ['Identify the type of sentence: “What a beautiful flower!”', 'Exclamatory', 'Interrogative', 'Imperative', 'Assertive', 'भावना व्यक्त करणारे उद्गारवाचक वाक्य.'],
      ['Identify the type of sentence: “Please shut the door.”', 'Imperative', 'Assertive', 'Interrogative', 'Exclamatory', 'आज्ञा/विनंती दर्शवणारे वाक्य: Imperative.'],
      ['Which part of speech is ‘quickly’ in “He runs quickly”?', 'Adverb', 'Adjective', 'Verb', 'Noun', 'क्रियेबद्दल माहिती देणारा शब्द: Adverb.'],
      ['Which part of speech is ‘beautiful’ in “a beautiful garden”?', 'Adjective', 'Adverb', 'Noun', 'Verb', 'नामाबद्दल माहिती: Adjective.'],
      ['Which part of speech is ‘and’?', 'Conjunction', 'Preposition', 'Interjection', 'Pronoun', 'दोन शब्द/वाक्ये जोडणारा: Conjunction.'],
      ['Which part of speech is ‘Alas!’?', 'Interjection', 'Conjunction', 'Adverb', 'Noun', 'भावना व्यक्त करणारा उद्गार: Interjection.'],
      ['Choose the correct comparative: He is ___ than me.', 'taller', 'more taller', 'tallest', 'most tall', 'दोघांची तुलना: comparative ‘taller than’.'],
      ['Choose the correct superlative: She is the ___ girl in the class.', 'cleverest', 'cleverer', 'more clever', 'most cleverest', 'सर्वांमध्ये तुलना: superlative.'],
      ['Choose the correct sentence.', 'I have finished my work.', 'I have finish my work.', 'I has finished my work.', 'I having finished my work.', 'Present perfect: have + V3.'],
      ['Choose the collective noun: a ___ of cattle.', 'herd', 'flock', 'pack', 'swarm', 'a herd of cattle; a flock of sheep; a pack of wolves; a swarm of bees.'],
      ['Choose the collective noun: a ___ of bees.', 'swarm', 'herd', 'flock', 'bunch', 'a swarm of bees.'],
      ['Choose the collective noun: a ___ of sheep.', 'flock', 'herd', 'swarm', 'pack', 'a flock of sheep.'],
      ['Choose the collective noun: a ___ of wolves.', 'pack', 'flock', 'herd', 'crowd', 'a pack of wolves.'],
    ]),
  ];
}
