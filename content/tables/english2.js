// English grammar — part 2: phrasal verbs, idioms, one-word substitution, spelling,
// error-spotting, voice, narration, question tags, prepositions (original example sentences)
import { tbl, fromTable, qa } from '../engine.js';

const S = 'english';

const PHRASAL = tbl(`
give up | stop doing something
look after | take care of
put off | postpone
turn up | arrive or appear
turn down | reject
call off | cancel
bring up | raise a child
look into | investigate
go into | examine in detail
carry out | perform or complete
break down | stop working
run out of | have no more of
take after | resemble an older relative
set out | begin a journey
put up with | tolerate
make up for | compensate for
look forward to | wait eagerly for
come across | meet or find by chance
get over | recover from
give in | surrender
`, ['pv', 'mean']);

const IDIOM2 = tbl(`
a silver lining | a ray of hope
point blank | directly and bluntly
at home in | comfortable and competent in
once in a blue moon | very rarely
break the ice | start a conversation in an awkward situation
spill the beans | reveal a secret
hit the nail on the head | be exactly right
burn the midnight oil | work or study late at night
cry over spilt milk | regret something that cannot be undone
a bolt from the blue | a complete surprise
in hot water | in trouble
a red-letter day | a memorable, important day
a white elephant | a costly but useless possession
at the eleventh hour | at the last moment
turn a deaf ear | refuse to listen
the apple of one's eye | someone very dear
by hook or by crook | by any means
zenith of power | the highest point of power
`, ['id', 'mean']);

const ONEW2 = tbl(`
A person appointed by the parties to settle their disputes | arbitrator
One who tries to avoid reality | escapist
One who believes in fate | fatalist
One who believes very easily | credulous
Loss of memory | amnesia
Loss of voice | aphonia
A song in praise of God | hymn
A speech made without preparation | extempore
One who poses to be better than he really is | humbug
One who loves mankind and helps others | philanthropist
One who hates mankind | misanthrope
One who knows everything | omniscient
One who is all-powerful | omnipotent
One who loves books | bibliophile
Inability to sleep | insomnia
One who never drinks alcohol | teetotaller
Published after the author's death | posthumous
That which cannot be read | illegible
That which cannot be heard | inaudible
That which cannot be conquered | invincible
Living at the same time | contemporary
A life story written by oneself | autobiography
Of unknown name or authorship | anonymous
Agreed by all | unanimous
`, ['def', 'w']);

const SPELL = tbl(`
accommodation | accomodation
necessary | neccessary
separate | seperate
occurrence | occurence
embarrass | embarass
reminiscence | remeniscence
sanatorium | sanetorium
disastrous | desastrous
committee | commitee
definitely | definately
privilege | priviledge
questionnaire | questionaire
rhythm | rhythem
achievement | acheivement
conscience | concience
maintenance | maintainance
pronunciation | pronounciation
receive | recieve
guarantee | gaurantee
millennium | millenium
`, ['ok', 'bad']);

const TAG = tbl(`
Let's go for a walk, ___? | shall we
I am right, ___? | aren't I
He never tells lies, ___? | does he
Open the door, ___? | will you
She can swim, ___? | can't she
They have finished, ___? | haven't they
Nobody came, ___? | did they
There is a problem, ___? | isn't there
`, ['s', 't']);

const PREP = tbl(`
He died ___ cancer. | of
She is good ___ mathematics. | at
I am fond ___ music. | of
He was accused ___ theft. | of
She is senior ___ me. | to
He prefers tea ___ coffee. | to
The train arrived ___ time. | on
He is married ___ my cousin. | to
She was angry ___ her brother. | with
He insisted ___ paying the bill. | on
`, ['s', 'p']);

export function genEnglish2() {
  // spelling: one correct word + three misspelt words from other rows
  const spell = SPELL.map((x, i) => {
    const others = [1, 2, 3].map((k) => SPELL[(i + k * 5) % SPELL.length].bad);
    return ['Choose the correctly spelt word.', x.ok, ...others, `Correct spelling: ${x.ok}. (Wrong forms: ${others.join(', ')})`];
  });
  return [
    ...fromTable(S, PHRASAL, { from: 'pv', to: 'mean', q: (x) => `What is the meaning of the phrasal verb ‘${x.pv}’?`, e: (x) => `${x.pv} = ${x.mean}.` }),
    ...fromTable(S, PHRASAL, { from: 'mean', to: 'pv', q: (x) => `Which phrasal verb means ‘${x.mean}’?`, e: (x) => `${x.mean} = ${x.pv}.` }),
    ...fromTable(S, IDIOM2, { from: 'id', to: 'mean', q: (x) => `What does the idiom ‘${x.id}’ mean?`, e: (x) => `${x.id} = ${x.mean}.` }),
    ...fromTable(S, IDIOM2, { from: 'mean', to: 'id', q: (x) => `Which idiom means ‘${x.mean}’?`, e: (x) => `${x.mean} = ${x.id}.` }),
    ...fromTable(S, ONEW2, { from: 'def', to: 'w', q: (x) => `One word for: ‘${x.def}’`, e: (x) => `${x.def} = ${x.w}.` }),
    ...fromTable(S, ONEW2, { from: 'w', to: 'def', q: (x) => `What is the meaning of ‘${x.w}’?`, e: (x) => `${x.w} = ${x.def}.` }),
    ...fromTable(S, TAG, { from: 's', to: 't', q: (x) => `Add the correct question tag: ${x.s}`, e: (x) => `${x.s.replace('___', x.t)}`, minPool: 4 }),
    ...fromTable(S, PREP, { from: 's', to: 'p', q: (x) => `Fill in the blank with the correct preposition: ${x.s}`, e: (x) => `${x.s.replace('___', x.p)}`, minPool: 4 }),
    ...qa(S, spell),
    ...qa(S, [
      ['Identify the grammatically correct sentence.', 'Each of the boys has a bag.', 'Each of the boys have a bag.', 'Each of the boy has a bag.', 'Each of the boys having a bag.', '‘Each of’ + plural noun takes a singular verb: has.'],
      ['Identify the grammatically correct sentence.', 'The news is good.', 'The news are good.', 'The news were good.', 'The newses are good.', '‘News’ is uncountable and takes a singular verb.'],
      ['Identify the grammatically correct sentence.', 'One of my friends lives in Pune.', 'One of my friend lives in Pune.', 'One of my friends live in Pune.', 'One of my friend live in Pune.', '‘One of’ + plural noun + singular verb.'],
      ['Identify the grammatically correct sentence.', 'The furniture in this room is new.', 'The furnitures in this room are new.', 'The furniture in this room are new.', 'The furnitures in this room is new.', '‘Furniture’ is uncountable: no plural form, singular verb.'],
      ['Identify the grammatically correct sentence.', 'I have known him for ten years.', 'I know him for ten years.', 'I am knowing him for ten years.', 'I have known him since ten years.', 'Present perfect with ‘for’ + period of time.'],
      ['Identify the grammatically correct sentence.', 'He has been living here since 2010.', 'He is living here since 2010.', 'He lives here since 2010.', 'He has been living here from 2010.', 'Present perfect continuous with ‘since’ + point of time.'],
      ['Identify the grammatically correct sentence.', 'She is senior to me.', 'She is senior than me.', 'She is senior from me.', 'She is more senior than me.', 'Senior, junior, superior, inferior take ‘to’, not ‘than’.'],
      ['Identify the grammatically correct sentence.', 'No sooner had he arrived than it started raining.', 'No sooner had he arrived when it started raining.', 'No sooner he arrived than it started raining.', 'No sooner did he arrived than it started raining.', '‘No sooner … than’ with inversion: No sooner had he arrived than …'],
      ['Identify the grammatically correct sentence.', 'Unless you work hard, you will fail.', 'Unless you do not work hard, you will fail.', 'Unless you will work hard, you will fail.', 'Unless if you work hard, you will fail.', '‘Unless’ already means ‘if not’; do not add another ‘not’.'],
      ['Identify the grammatically correct sentence.', 'He is taller than any other boy in the class.', 'He is taller than any boy in the class.', 'He is tallest than any other boy in the class.', 'He is more taller than any other boy in the class.', 'Comparing one with others of the same group: ‘than any other’.'],
      ['Identify the grammatically correct sentence.', 'If I were you, I would accept the offer.', 'If I was you, I will accept the offer.', 'If I am you, I would accept the offer.', 'If I were you, I will accept the offer.', 'Imaginary condition: If + were, would + verb.'],
      ['Identify the grammatically correct sentence.', 'I look forward to meeting you.', 'I look forward to meet you.', 'I look forward for meeting you.', 'I am look forward to meeting you.', '‘Look forward to’ is followed by a gerund (-ing).'],
      ['Choose the correct article: He is ___ honest man.', 'an', 'a', 'the', 'no article', '‘Honest’ begins with a vowel sound (h is silent): an honest man.'],
      ['Choose the correct article: She studies at ___ university in Pune.', 'a', 'an', 'the', 'no article', '‘University’ begins with a ‘yu’ (consonant) sound: a university.'],
      ['Change into passive voice: They are building a new bridge.', 'A new bridge is being built by them.', 'A new bridge was being built by them.', 'A new bridge has been built by them.', 'A new bridge is built by them.', 'Present continuous passive: is/are being + past participle.'],
      ['Change into passive voice: She wrote a letter.', 'A letter was written by her.', 'A letter is written by her.', 'A letter has been written by her.', 'A letter was wrote by her.', 'Simple past passive: was/were + past participle.'],
      ['Change into passive voice: Who broke the window?', 'By whom was the window broken?', 'Who was the window broken?', 'By whom the window was broken?', 'Who broken the window?', 'Passive of a ‘who’ question: By whom + was/were + subject + past participle?'],
      ['Change into passive voice: Shut the door.', 'Let the door be shut.', 'The door is shut.', 'The door should shut.', 'Let the door shut.', 'Imperative passive: Let + object + be + past participle.'],
      ['Change into indirect speech: He said, “I am tired.”', 'He said that he was tired.', 'He said that I am tired.', 'He said that he is tired.', 'He said that he had tired.', 'Reporting verb in past: present becomes past (am → was).'],
      ['Change into indirect speech: She said to me, “Where do you live?”', 'She asked me where I lived.', 'She asked me where do I live.', 'She said me where I lived.', 'She asked me where did I live.', 'Wh- questions become statements in indirect speech; tense shifts back.'],
      ['Change into indirect speech: He said, “I went to Mumbai yesterday.”', 'He said that he had gone to Mumbai the day before.', 'He said that he went to Mumbai yesterday.', 'He said that he had went to Mumbai the day before.', 'He told that he has gone to Mumbai yesterday.', 'Simple past → past perfect; yesterday → the day before.'],
      ['Identify the type of the underlined clause: I know that he is honest. (that he is honest)', 'Noun clause', 'Adjective clause', 'Adverb clause', 'Principal clause', 'The clause is the object of ‘know’, so it is a noun clause.'],
      ['Identify the type of the underlined clause: This is the house where I was born. (where I was born)', 'Adjective clause', 'Noun clause', 'Adverb clause', 'Principal clause', 'It describes the noun ‘house’, so it is an adjective clause.'],
      ['Identify the type of the underlined clause: I will wait until you come. (until you come)', 'Adverb clause', 'Noun clause', 'Adjective clause', 'Principal clause', 'It tells ‘when’ about the verb ‘wait’, so it is an adverb clause of time.'],
    ]),
  ];
}

export const ALL = { PHRASAL, IDIOM2, ONEW2, TAG, PREP };
