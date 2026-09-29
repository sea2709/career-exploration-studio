import type {StructureBuilder} from 'sanity/structure'
import {CaseIcon} from '@sanity/icons/Case'
import {DatabaseIcon} from '@sanity/icons/Database'

const ONET_REFERENCE_TYPES = [
  'onetContentModelElement',
  'onetScale',
  'onetJobZone',
  'onetRatingCategory',
  'onetLevelScaleAnchor',
]

export const ONET_TYPE_NAMES = ['onetOccupation', ...ONET_REFERENCE_TYPES]

export function onetStructureItems(S: StructureBuilder) {
  return [
    S.listItem()
      .title('O*NET')
      .icon(DatabaseIcon)
      .child(
        S.list()
          .title('O*NET 31.0')
          .items([
            S.listItem()
              .title('Occupations')
              .icon(CaseIcon)
              .child(S.documentTypeList('onetOccupation').title('Occupations')),
            S.divider(),
            S.listItem()
              .title('Reference data')
              .child(
                S.list()
                  .title('Reference data')
                  .items(
                    ONET_REFERENCE_TYPES.map((type) =>
                      S.listItem()
                        .title(
                          type
                            .replace(/^onet/, '')
                            .replace(/([A-Z])/g, ' $1')
                            .trim(),
                        )
                        .child(S.documentTypeList(type).title(type)),
                    ),
                  ),
              ),
          ]),
      ),
  ]
}
