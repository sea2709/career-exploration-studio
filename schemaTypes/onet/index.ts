import {onetContentModelElement} from './reference/contentModelElement'
import {onetInterest} from './reference/interest'
import {onetInterestAreaScore} from './objects/interestAreaScore'
import {onetJobZone} from './reference/jobZone'
import {onetRatingCategory} from './reference/ratingCategory'
import {onetScale} from './reference/scale'
import {onetLevelScaleAnchor} from './documents/levelScaleAnchor'
import {onetOccupation} from './documents/occupation'
import {onetJobTitleItem} from './objects/jobTitleItem'
import {onetRatingItem} from './objects/ratingItem'
import {onetRelatedOccupationItem} from './objects/relatedOccupationItem'
import {onetSoftwareSkillItem} from './objects/softwareSkillItem'
import {onetTaskItem} from './objects/taskItem'
import {onetTaskRatingItem} from './objects/taskRatingItem'
import {onetTaskDwaItem} from './objects/taskDwaItem'
import {onetEmergingTaskItem} from './objects/emergingTaskItem'
import {onetReportedTitleItem} from './objects/reportedTitleItem'
import {onetOccupationMetadataItem} from './objects/occupationMetadataItem'
import {onetSurveyItem} from './objects/surveyItem'
import {onetWorkStyleItem} from './objects/workStyleItem'

/** O*NET 31.0 content types — aligned with https://www.onetcenter.org/dictionary/31.0/mysql/ */
export const onetSchemaTypes = [
  // Reference / lookup tables
  onetContentModelElement,
  onetScale,
  onetJobZone,
  onetRatingCategory,
  onetLevelScaleAnchor,
  onetInterest,
  // Element-level rows embedded in onetContentModelElement
  onetSurveyItem,
  // Occupation hub
  onetOccupation,
  // Occupation-specific rows embedded in onetOccupation
  onetTaskItem,
  onetTaskRatingItem,
  onetTaskDwaItem,
  onetEmergingTaskItem,
  onetJobTitleItem,
  onetReportedTitleItem,
  onetSoftwareSkillItem,
  onetWorkStyleItem,
  onetRatingItem,
  onetRelatedOccupationItem,
  onetInterestAreaScore,
  onetOccupationMetadataItem,
]
