import {defineField, defineType} from 'sanity'
import {HeartIcon} from '@sanity/icons/Heart'

/** One Specific Interest Area row, embedded in onetOccupation.interestProfile.areas */
export const onetInterestAreaScore = defineType({
  name: 'onetInterestAreaScore',
  title: 'Interest Area Score',
  type: 'object',
  icon: HeartIcon,
  fields: [
    defineField({
      name: 'area',
      title: 'Interest Area',
      type: 'reference',
      to: [{type: 'onetInterest'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Denormalized area name for fast reads',
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'number',
      description: 'Occupational Interests scale (OI), 1–7',
      validation: (rule) => rule.required().min(1).max(7),
    }),
    defineField({
      name: 'displayRank',
      title: 'Display Rank',
      type: 'number',
      description: 'Summary Display Rank (DS); 0 means not among the top areas',
    }),
  ],
  preview: {
    select: {title: 'name', score: 'score', rank: 'displayRank'},
    prepare({title, score, rank}) {
      return {
        title: title ?? 'Interest area',
        subtitle: [`OI ${score ?? '—'}`, rank ? `rank ${rank}` : null].filter(Boolean).join(' · '),
      }
    },
  },
})
