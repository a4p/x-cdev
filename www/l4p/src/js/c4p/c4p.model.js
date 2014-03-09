/**************************************************************************************
 *
 * 								OBJECT MODEL TEMPLATE
 *
 **************************************************************************************
 * 'Object': {
            isAttachment:false,		// TODO
            icon: 'comments',		// used in aside menu to display icon
            colorType: 'b',			// css class

			// reference of all fields that can be managed by this 'Object'
            fields: [
                'key 1',
				'key n...'
            ],

			// TODO
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'assigned_contact_id', one: 'leader', many: 'led', types: ['Contact']},
                {key: 'what_id', one: 'affecter', many: 'affected', types: ['Account', 'Opportunity']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],

			// Structure describing all fields data to manage
			// with form validation and necessary calculations for edit dialog object modal
            editObjectFields:{
                'key 1': {
					// The field label
					title: 'keyForLocalization',

					// The field type, which define the html5 input used behind
					type: 'email/tel/textarea/currency...',

					//Default value if field is empty
					defaultValue: 'keyForLocalization',

					// Must this field be autofocused when opening modal ?
					autofocus: true/false,

					// Literal Expressions or regexp for form field validation
                    validations: [
                        {expr: 'literal expr', errorKey: 'Model.createErrMsg(scope, \'errMsgKeyForLocalization\', ['errMsgParam1', ..., 'errMsgParamN'])'},
						...
                    ],

					// Function to be called to set default field value
                    defaultSetter:'nextNextHour',

					// Calculations made in real time during form validation process
					// used when interactions between fields
                    calculations: [
                        {toField: 'fieldToUpdate', fromFields: ['fieldInvolved1', ..., 'fieldInvolvedN'], getter: 'methodToCall'},
						...
                    ]},
				...
            },

			//TODO
            calculateObjectFields:[
                {
                    key:'duration_hours',
                    fields: ['date_start', 'date_end'],
                    force:true,
                    getter: 'diffHours'
                }
            ],

			// Structure defining all objects to display in edit dialog object modal
			// with their groups
            editObjectGroups:[
                {
					// Technical id of the group
                    key:'groupId',

					// Group label
                    title: 'groupKeyForLocalization',

					// GRoup list of fields from 'fields' structure
                    fields: ['key 1', ..., 'key n']
                },
            ],

			// TODO
            displayNameList: [['name']],
            displayDescription: ['description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
				...
            ],

			// TODO
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: 'a',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                    ]
                },
				...
            ],

			// Structure defining all fields to be displayed in detailed view
            displayDetailedObjectCards: [
                {
                    type: 'someClassLetter',						// Deprecated, used for 'well' CSS classes
                    brSeparated: true/false,						// Tells whether the card must be <br /> separated
                    groups: [										// List of card groups
                        {
                            synchro: true/false,					// if true, this group will display synchronization icons if synchronizing with CRM
                            icon: true/false,						//
                            name: true/false,						// If true, this group will display the object compiled name
                            title: 'keyForLocalization',			// Localized key for group label
                            size: 'bigger/small...',				// css class for group font-size
                            fields: [								// List of fields included in this group
								{
                                    key: 'key 1',
                                    title: true/false,				// If true, display the field label retrieved from 'editObjectFields' structure
                                    prefix: 'keyForLocalization',	// Localized string to prefix field (in separate span)
                                    suffix: 'keyForLocalization',	// Localized string to suffix field (in separate span)
                                    size: 'bigger/small...'			// css class for field font-size
                                },
                            ]
                        },
						...
                    ]
                },
				...
            ]
		}
 */
'use strict';

// Namespace c4p
var c4p;
if (!c4p) c4p = {};

c4p.Model = (function () {
    // Constructor
    function Model() {
        this.version = "0.1";
    }

    // Public API

    Model.a4p_types = {
        'Facet': {
                isAttachment:false,
            icon: 'tag',
            colorType: 'j',
            fields: [
                'prefix',// pseudo rank to change alphabetic order
                'name',
                'description',
                'facets_ids',
                'items_ids',
                'parent_id',
                'owner_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'facets_ids', one: 'child', many: 'parent', types: ['Facet']},// same names as for parent_id to mirror these relations
                {key: 'items_ids', one: 'faceted', many: 'faceter', types: ['Account', 'Contact', 'Event', 'Task', 'Opportunity', 'Lead', 'Document', 'Note', 'Report']},
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Facet'], cascadeDelete: 'many'},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'prefix': {title: 'htmlFormPrefix', type: '', defaultValue: ''},
                'name': {title: 'htmlFormName', type: '',
                    defaultValue: '',
                    validations: [
                                  {expr: 'object.name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormPrefix\'])'}
                              ]},
                'description': {title: '', type: 'textarea', defaultValue: ''},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[],
            editObjectGroups:[
                {
                    key:'title',
                    title: 'htmlFieldsetTitle',
                    fields: ['prefix', 'name']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description']
                }
            ],
            displayNameList: [['name']],
            displayDescription: ['description'],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: []
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: false,
                            title: '',
                            size: 'bigger',
                            fields: [
                                {
                                    key: 'prefix',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'bigger'
                                },
                                {
                                    key: 'name',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'bigger'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Contact': {
            isAttachment:false,
            icon: 'user',
            colorType: 'm',
            fields: [
                'salutation',
                'first_name',
                'last_name',
                'title',
                'account_id',
                'phone_work',
                'phone_mobile',
                'phone_fax',
                'phone_house',
                'phone_other',
                'email',
                'email_home',
                'email_list',
                'email_other',
                'primary_address_street',
                'primary_address_city',
                'primary_address_zipcode',
                'primary_address_state',
                'primary_address_country',
                'alt_address_street',
                'alt_address_city',
                'alt_address_zipcode',
                'alt_address_state',
                'alt_address_country',
                'description',
                'manager_id',
                'contact_type',
                'assigned_contact_id',
                'birthday',
                'department',
                'assistant_name',
                'assistant_phone',
                'lead_source',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'assigned_contact_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'account_id', one: 'accounter', many: 'accounted', types: ['Account']},// TODO : replace 'accounter' by 'company'
                {key: 'manager_id', one: 'manager', many: 'managed', types: ['Contact']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'salutation': {title: 'htmlFormSalutation', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsSalutation'], optionList: 'htmlOptionsSalutation',
                    validations: [
                                  {expr: 'object.salutation.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormSalutation\', 40])'}
                              ]},
                'first_name': {title: 'htmlFormFirstName', type: '',
                    defaultValue: 'htmlDefaultNewContact', autofocus: true,
                    validations: [
                        {expr: 'object.first_name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormFirstName\'])'},
                        {expr: 'object.first_name.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormFirstName\', 40])'}
                    ]},
                'last_name': {title: 'htmlFormLastName', type: '',
                    defaultValue: 'htmlDefaultNewContact',
                    validations: [
                        {expr: 'object.last_name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormLastName\'])'},
                        {expr: 'object.last_name.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormLastName\', 80])'}
                    ]},
                'title': {title: 'htmlFormTitle', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.title.length < 128', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormTitle\', 128])'}
                              ]},
                'phone_work': {title: 'htmlFormWork', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_work.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormWork\', 40])'},
                                  {expr: 'object.phone_work.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_work)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormWork\'])'}
                              ]},
                'phone_mobile': {title: 'htmlFormMobile', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_mobile.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormMobile\', 40])'},
                                  {expr: 'object.phone_mobile.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_mobile)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormMobile\'])'}
                              ]},
                'phone_fax': {title: 'htmlFormFax', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_fax.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormFax\', 40])'},
                                  {expr: 'object.phone_fax.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_fax)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormFax\'])'}
                              ]},
                'phone_house': {title: 'htmlFormHouse', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_house.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormHouse\', 40])'},
                                  {expr: 'object.phone_house.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_house)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormHouse\'])'}
                              ]},
                'phone_other': {title: 'htmlFormOther', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_other.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormOther\', 40])'},
                                  {expr: 'object.phone_other.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_other)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormOther\'])'}
                              ]},
                'email': {title: 'htmlFormEmail', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.email.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormEmail\', 80])'},
                                  {expr: 'object.email.length == 0 || /^[\\w._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(object.email)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorEmailFormat\', [\'htmlFormEmail\'])'}
                              ]},
                'email_home': {title: 'htmlFormHome', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.email_home.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormHome\', 80])'},
                                  {expr: 'object.email_home.length == 0 || /^[\\w._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(object.email_home)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorEmailFormat\', [\'htmlFormHome\'])'}
                              ]},
                'email_list': {title: 'htmlFormList', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.email_list.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormList\', 80])'},
                                  {expr: 'object.email_list.length == 0 || /^[\\w._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(object.email_list)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorEmailFormat\', [\'htmlFormList\'])'}
                              ]},
                'email_other': {title: 'htmlFormOther', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.email_other.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormOther\', 80])'},
                                  {expr: 'object.email_other.length == 0 || /^[\\w._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(object.email_other)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorEmailFormat\', [\'htmlFormOther\'])'}
                              ]},
              'primary_address_street': {title: 'htmlFormStreet', type: '', defaultValue: '',
                  validations: [
                                {expr: 'object.primary_address_street.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStreet\', 255])'}
                            ]},
              'primary_address_city': {title: 'htmlFormCity', type: '', defaultValue: '',
                  validations: [
                                {expr: 'object.primary_address_city.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCity\', 40])'}
                            ]},
              'primary_address_zipcode': {title: 'htmlFormZipCode', type: '', defaultValue: '',
                  validations: [
                                {expr: 'object.primary_address_zipcode.length < 20', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormZipCode\', 20])'}
                            ]},
              'primary_address_state': {title: 'htmlFormState', type: '', defaultValue: '',
                  validations: [
                                {expr: 'object.primary_address_state.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormState\', 80])'}
                            ]},
              'primary_address_country': {title: 'htmlFormCountry', type: '', defaultValue: '',
                  validations: [
                                {expr: 'object.primary_address_country.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCountry\', 80])'}
                            ]},
                'alt_address_street': {title: 'htmlFormStreet', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_street.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStreet\', 255])'}
                              ]},
                'alt_address_city': {title: 'htmlFormCity', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_city.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCity\', 40])'}
                              ]},
                'alt_address_zipcode': {title: 'htmlFormZipCode', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_zipcode.length < 20', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormZipCode\', 20])'}
                              ]},
                'alt_address_state': {title: 'htmlFormState', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_state.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormState\', 80])'}
                              ]},
                'alt_address_country': {title: 'htmlFormCountry', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_country.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCountry\', 80])'}
                              ]},
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                              ]},
                'birthday': {title: 'htmlFormBirthday', type: 'date', defaultValue: '', 'defaultSetter':'now'},
                'department': {title: 'htmlFormDepartment', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.department.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDepartment\', 80])'}
                              ]},
                'assistant_name': {title: 'htmlFormAssistantName', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.assistant_name.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormAssistantName\', 40])'}
                              ]},
                'assistant_phone': {title: 'htmlFormAssistantPhone', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.assistant_phone.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormAssistantPhone\', 40])'},
                                  {expr: 'object.assistant_phone.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.assistant_phone)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormAssistantPhone\'])'}
                              ]},
                'lead_source': {title: 'htmlFormLeadSource', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsLeadSource'], optionList: 'htmlOptionsLeadSource',
                    validations: [
                                  {expr: 'object.lead_source.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormLeadSource\', 40])'}
                              ]},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[
                {
                    key:'contact_type',
                    fields: [],
                    force:false,
                    getter: 'contactType'// 'Contact' by default
                }
            ],
            editObjectGroups:[
                {
                    key:'details',
                    title: 'htmlFieldsetDetails',
                    fields: ['salutation', 'first_name', 'last_name', 'title', 'birthday']
                },
                {
                    key:'phones',
                    title: 'htmlFieldsetPhones',
                    fields: ['phone_work', 'phone_mobile', 'phone_fax', 'phone_house', 'phone_other']
                },
                {
                    key:'emails',
                    title: 'htmlFieldsetEmails',
                    fields: ['email', 'email_home', 'email_list', 'email_other']
                },
                {
                    key:'primary_address',
                    title: 'htmlFieldsetPrimaryAddress',
                    fields: ['primary_address_street', 'primary_address_city', 'primary_address_zipcode', 'primary_address_state', 'primary_address_country']
                },
                {
                    key:'alt_address',
                    title: 'htmlFieldsetAlternateAddress',
                    fields: ['alt_address_street', 'alt_address_city', 'alt_address_zipcode', 'alt_address_state', 'alt_address_country']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description', 'lead_source']
                },
                {
                    key:'work',
                    title: 'htmlFieldsetWork',
                    fields: ['department', 'assistant_name', 'assistant_phone']
                }
            ],
            displayNameList: [
                ['last_name', 'first_name'],
                ['first_name', 'last_name'],
                ['salutation', 'first_name', 'last_name'],
                ['salutation', 'last_name', 'first_name']
            ],
            displayDescription: ['description', 'email'],
            displayResumedObjectGroups: [
                {
                    key: 'work',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'account_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'department',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone_work',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'phone_house',
                            title: false,
                            prefix: '',
                            suffix: 'htmlFormHouseAbbrev',
                            size: ''
                        },
                        {
                            key: 'phone_mobile',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'email',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'work',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'account_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'department',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone_work',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'phone_house',
                            title: false,
                            prefix: '',
                            suffix: 'htmlFormHouseAbbrev',
                            size: ''
                        },
                        {
                            key: 'phone_mobile',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'email',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'title',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'big'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'account_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'department',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone_work',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone_house',
                                    title: false,
                                    prefix: '',
                                    suffix: 'htmlFormHouseAbbrev',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone_mobile',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'email',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'c',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlFormTitleContactDetails',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_street',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_city',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'primary_address_zipcode',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_state',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'primary_address_country',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone_fax',
                                    title: false,
                                    prefix: '',
                                    suffix: 'htmlFormFaxAbbrev',
                                    size: ''
                                },
                                {
                                    key: 'assistant_name',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'assistant_phone',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'e',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlFormTitlePersonal',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'birthday',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'g',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlFormTitleOtherContactDetails',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'alt_address_street',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'alt_address_city',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'alt_address_zipcode',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'alt_address_state',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'alt_address_country',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone_other',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'lead_source',
                                    title: false,
                                    prefix: 'htmlTextContactOrigin',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'contact_type',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Account': {
            isAttachment: false,
            icon: 'building',
            colorType: 'm',
            fields: [
                'company_name',
                'phone',
                'fax',
                'web_url',
                'bil_addr_street',
                'bil_addr_city',
                'bil_addr_postal_code',
                'bil_addr_state',
                'bil_addr_country',
                //'ship_addr_street',
                //'ship_addr_city',
                //'ship_addr_postal_code',
                //'ship_addr_state',
                //'ship_addr_country',
                'description',
                'annual_revenue',
                //'rating',
                'nb_employees',
                //'year_started',
                'industry',
                'sic',
                'type',
                'parent_id',
                'assigned_contact_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'assigned_contact_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Account'], cascadeDelete: 'many'},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'company_name': {title: 'htmlFormCompanyName', type: '', autofocus: true,
                    defaultValue: 'htmlDefaultNewAccount',
                    validations: [
                        {expr: 'object.company_name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormCompanyName\'])'},
                        {expr: 'object.company_name.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCompanyName\', 255])'}
                    ]},// Non empty field required in SalesForce
                'fax': {title: 'htmlFormFax', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.fax.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormFax\', 40])'},
                                  {expr: 'object.fax.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.fax)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormFax\'])'}
                              ]},
                'phone': {title: 'htmlFormPhone', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormPhone\', 40])'},
                                  {expr: 'object.phone.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormPhone\'])'}
                              ]},
                  'web_url': {title: 'htmlFormWebsite', type: 'url', defaultValue: '',
                      validations: [
                                    {expr: 'object.web_url.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormWebsite\', 255])'}
                                ]},
                'bil_addr_street': {title: 'htmlFormStreet', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.bil_addr_street.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStreet\', 255])'}
                              ]},
                'bil_addr_city': {title: 'htmlFormCity', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.bil_addr_city.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCity\', 40])'}
                              ]},
                'bil_addr_postal_code': {title: 'htmlFormZipCode', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.bil_addr_postal_code.length < 20', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormZipCode\', 20])'}
                              ]},
                'bil_addr_state': {title: 'htmlFormState', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.bil_addr_state.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormState\', 80])'}
                              ]},
                'bil_addr_country': {title: 'htmlFormCountry', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.bil_addr_country.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCountry\', 80])'}
                              ]},
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                            ]},
                'annual_revenue': {title: 'htmlFormAnnualIncome', type: 'currency',
                    defaultValue: 0,
                    validations: [
                        {expr: '/^\\d+$/.test(object.annual_revenue) && object.annual_revenue >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireInteger\', [\'htmlFormAnnualIncome\'])'}
                    ]},
                'nb_employees': {title: 'htmlFormEmployeeNumber', type: 'number',
                    defaultValue: 0,
                    validations: [
                                  {expr: '/^\\d+$/.test(object.nb_employees) && object.nb_employees >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireInteger\', [\'htmlFormEmployeeNumber\'])'}
                    ]},
                //'year_started',
                'industry': {title: 'htmlFormIndustry', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsIndustry'], optionList: 'htmlOptionsIndustry',
                    validations: [
                                  {expr: 'object.industry.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormIndustry\', 40])'}
                              ]},
                'sic': {title: 'htmlFormSicCode', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.sic.length < 20', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormSicCode\', 20])'}
                              ]},
                'type': {title: 'htmlFormType', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.type.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormType\', 40])'}
                              ]},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[
                {
                    key:'web_url',
                    fields: ['web_url'],
                    force:true,
                    getter: 'httpPrefixUrl'
                }
            ],
            editObjectGroups:[
                {
                    key:'title',
                    title: 'htmlFieldsetTitle',
                    fields: ['company_name']
                },
                {
                    key:'phones',
                    title: 'htmlFieldsetPhones',
                    fields: ['phone', 'fax']
                },
                {
                    key:'bil_addr',
                    title: 'htmlFieldsetBillingAddress',
                    fields: ['bil_addr_street', 'bil_addr_city', 'bil_addr_postal_code', 'bil_addr_state', 'bil_addr_country']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description', 'web_url']
                },
                {
                    key:'work',
                    title: 'htmlFieldsetWork',
                    fields: ['annual_revenue', 'nb_employees', 'industry', 'sic', 'type']
                }
            ],
            displayNameList: [['company_name']],
            displayDescription: ['description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'type',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'web_url',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'type',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'web_url',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                                {
                                    key: 'type',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'big'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'fax',
                                    title: false,
                                    prefix: '',
                                    suffix: 'htmlFormFaxAbbrev',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'web_url',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'c',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlFormTitleSegmentation',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'industry',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'nb_employees',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'annual_revenue',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'sic',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'e',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'bil_addr_street',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'bil_addr_city',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'bil_addr_postal_code',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'bil_addr_state',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'bil_addr_country',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Event': {
            isAttachment:false,
            icon: 'comments',
            colorType: 'b',
            fields: [
                'name',
                'location',
                'date_start',
                'date_end',
                'duration_hours',
                'duration_minutes',
                'description',
                'what_id',
                'owner_id',
                'assigned_contact_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'assigned_contact_id', one: 'leader', many: 'led', types: ['Contact']},
                {key: 'what_id', one: 'affecter', many: 'affected', types: ['Account', 'Opportunity']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'name': {title: 'htmlFormName', type: '', defaultValue: 'htmlDefaultEventName', autofocus: true
                    ,validations: [
                        {expr: 'object.name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormName\'])'},
                        {expr: 'object.name.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormName\', 255])'}
                    ]},
                'location': {title: 'htmlFormLocation', type: '', defaultValue: ''
                	,validations: [
                        {expr: 'object.location.length < 200', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormLocation\', 200])'}
                    ]},
                'date_start': {title: 'htmlFormDateStart', type: 'datetime', defaultValue: ''
                    ,defaultSetter:'nextHour'
                    ,calculations: [
                        {toField: 'date_end', fromFields: ['date_start', 'duration_hours', 'duration_minutes'], getter: 'dateEndFromStart'},
                        {toField: 'duration_hours', fromFields: ['date_start', 'date_end'], getter: 'diffHours'},
                        {toField: 'duration_minutes', fromFields: ['date_start', 'date_end'], getter: 'diffMinutesInHour'}
                    ]
                    ,validations: [
                        {expr: 'object.date_start.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormDateStart\'])'},
                        {expr: 'a4pDateParse(object.date_start).getTime() < a4pDateParse(object.date_end).getTime()', errorKey: 'Model.createErrMsg(scope, \'htmlErrorDatesOrder\', [\'htmlFormDateStart\', \'htmlFormDateEnd\'])'}
                    ]},
                'date_end': {title: 'htmlFormDateEnd', type: 'datetime',
                    defaultValue: '',
                    defaultSetter:'nextNextHour',
                    calculations: [
                        {toField: 'date_start', fromFields: ['date_start', 'date_end', 'duration_hours', 'duration_minutes'], getter: 'dateStartFromEnd'},
                        {toField: 'duration_hours', fromFields: ['date_start', 'date_end'], getter: 'diffHours'},
                        {toField: 'duration_minutes', fromFields: ['date_start', 'date_end'], getter: 'diffMinutesInHour'}
                    ],
                    validations: [
                        {expr: 'object.date_end.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormDateEnd\'])'},
                        {expr: 'a4pDateParse(object.date_start).getTime() < a4pDateParse(object.date_end).getTime()', errorKey: 'Model.createErrMsg(scope, \'htmlErrorDatesOrder\', [\'htmlFormDateStart\', \'htmlFormDateEnd\'])'}
                    ]},
                /*
                 'duration_hours': {title: 'htmlFormDurationHours', type: '', defaultValue: '0',
                 validations: [
                 {expr: 'object.duration_hours.length > 0', errorKey: 'htmlRequiredDuration'},
                 {expr: 'object.duration_hours >= 0', errorKey: 'htmlRequiredPositiveDuration'}
                 ]},
                 'duration_minutes': {title: 'htmlFormDurationMinutes', type: '', defaultValue: '0',
                 validations: [
                 {expr: 'object.duration_minutes.length > 0', errorKey: 'htmlRequiredDuration'},
                 {expr: 'object.duration_minutes >= 0', errorKey: 'htmlRequiredPositiveDuration'}
                 ]},
                 */
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
	                validations: [
		                {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
		            ]},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[
                {
                    key:'duration_hours',
                    fields: ['date_start', 'date_end'],
                    force:true,
                    getter: 'diffHours'
                },
                {
                    key:'duration_minutes',
                    fields: ['date_start', 'date_end'],
                    force:true,
                    getter: 'diffMinutesInHour'
                }
            ],
            editObjectGroups:[
                {
                    key:'title',
                    title: 'htmlFieldsetDetails',
                    fields: ['name', 'location', 'date_start', 'date_end']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description']
                }
            ],
            displayNameList: [['name']],
            displayDescription: ['description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
                {
                    key: 'attendees',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'attendee',//Use MANY link side of Attendee object
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'time',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_start',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'smaller'
                        },
                        {
                            key: 'date_end',
                            type: 'duration',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'smaller'
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: 'a',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'attendee',//Use MANY link side of Attendee object
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'time',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_start',
                            type: 'time',
                            title: false,
                            prefix: '',
                            suffix: 'rangeSeparator',
                            size: 'smaller'
                        },
                        {
                            key: 'date_end',
                            type: 'time',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'smaller'
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'date_start',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'date_end',
                                    type: 'duration',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'location',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'leader',
                                    title: false,
                                    prefix: 'htmlTextContactOrigin',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'leaderType',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Task': {
            isAttachment:false,
            icon: 'tasks',
            colorType: 'b',
            fields: [
                'name',
                'date_start',
                'is_reminder_set',
                'date_reminder',
                'description',
                'status',
                'what_id',
                'owner_id',
                'assigned_contact_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'assigned_contact_id', one: 'leader', many: 'led', types: ['Contact']},
                {key: 'what_id', one: 'affecter', many: 'affected', types: ['Account', 'Opportunity']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'name': {title: 'htmlFormName', type: '',
                    defaultValue: 'htmlDefaultTaskName', autofocus: true,
                    validations: [
                        {expr: 'object.name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormName\'])'},
                        {expr: 'object.name.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormName\', 255])'}
                    ]},
                'date_start': {title: 'htmlFormDueDate', type: 'date',
                    defaultValue: '',
                    defaultSetter:'tomorrow',
                    validations: [
                        {expr: 'object.date_start.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormDateStart\'])'}
                    ]},
                'is_reminder_set': {title: 'htmlFormReminderSet', type: 'boolean', defaultValue: false},
                'date_reminder': {title: 'htmlFormDateReminder', type: 'datetime',
                    defaultValue: '',
                    defaultSetter:'tomorrowPrevHour',
                    validations: [
                        {expr: '!object.is_reminder_set || (object.date_reminder.length > 0)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormDateReminder\'])'},
                        {expr: '!object.is_reminder_set || (a4pDateParse(object.date_reminder).getTime() < a4pDateParse(object.date_start).getTime())', errorKey: 'Model.createErrMsg(scope, \'htmlErrorDatesOrder\', [\'htmlFormDateStart\', \'htmlFormDateReminder\'])'}
                    ]},
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
		              ]},
                'status': {title: 'htmlFormStatus', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.status.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStatus\', 255])'}
                                  //,TODO : from picklist
		              ]},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[],
            editObjectGroups:[
                {
                    key:'title',
                    title: 'htmlFieldsetDetails',
                    fields: ['name', 'date_start', 'is_reminder_set', 'date_reminder']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description']
                },
                {
                    key:'other',
                    title: 'htmlFieldsetOther',
                    fields: ['status']
                }
            ],
            displayNameList: [['name']],
            displayDescription: ['description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
                {
                    key: 'time',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_start',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'smaller'
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: 'a',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'location',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
                {
                    key: 'time',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_start',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'smaller'
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'date_start',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'location',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'date_reminder',
                                    title: false,
                                    prefix: 'htmlTextReminder',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'is_reminder_set',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Opportunity': {
            isAttachment:false,
            icon: 'flag',
            colorType: 'm',
            fields: [
                'name',
                'date_closed',
                'stage',
                'amount',
                //'currency_iso_code',
                'next_step',
                'probability',
                'type',
                'description',
                'account_id',
                'contact_id',
                'assigned_contact_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'assigned_contact_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'contact_id', one: 'accounter', many: 'accounted', types: ['Contact']},
                {key: 'account_id', one: 'accounter', many: 'accounted', types: ['Account']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'name': {title: 'htmlFormName', type: '', defaultValue: 'htmlDefaultOpportunityName', autofocus: true
                    ,validations: [
                        {expr: 'object.name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormName\'])'},
                        {expr: 'object.name.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormName\', 255])'}
                    ]},// Non empty field required in SalesForce
                'date_closed': {title: 'htmlFormDateClosed', type: 'date', defaultValue: '',
                    defaultSetter: 'tomorrow',
                    validations: [
                        {expr: 'object.date_closed.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormDateClosed\'])'}
                    ]},// Non empty field required in SalesForce
                'stage': {title: 'htmlFormStage', type: 'select', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsOpportunityStage'], optionList: 'htmlOptionsOpportunityStage',
                    defaultValue: '',
                    validations: [
                        {expr: 'object.stage.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormStage\'])'},
                        {expr: 'object.stage.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStage\', 40])'}
                    ]},// Non empty field required in SalesForce
                'amount': {title: 'htmlFormAmount', type: 'currency',
                    defaultValue: 0,
                    validations: [
                                  {expr: 'object.amount != null && /^(\\d+)([.,]\\d{1,2})?$/.test(object.amount) && object.amount >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireDouble\', [\'htmlFormAmount\'])'}
                              ]},
                //'currency_iso_code',
                'next_step': {title: 'htmlFormNextStep', type: '', defaultValue: ''
                    ,validations: [
                                   {expr: 'object.next_step.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormNextStep\', 255])'}
                               ]},
                'probability': {title: 'htmlFormProbability', type: 'number',
                    defaultValue: 100,
                    validations: [
                                  {expr: '/^\\d+$/.test(object.probability) && object.probability >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireInteger\', [\'htmlFormProbability\'])'},
                                  {expr: 'object.probability <= 100', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxValue\', [\'htmlFormProbability\', 100])'}
                              ]},
                'type': {title: 'htmlFormType', type: '', defaultValue: ''
                    ,validations: [
                                   {expr: 'object.type.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormType\', 40])'}
                               ]},
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                              ]},
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[],
            editObjectGroups:[
                {
                    key:'details',
                    title: 'htmlFieldsetDetails',
                    fields: ['name']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description']
                },
                {
                    key:'work',
                    title: 'htmlFieldsetWork',
                    fields: ['date_closed', 'stage', 'amount', 'next_step', 'probability', 'type']
                }
            ],
            displayNameList: [['name']],
            displayDescription: ['amount','description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'type',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'amount',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'amount',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
                {
                    key: 'probability',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'probability',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'closed',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_closed',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'type',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'amount',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'amount',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                },
                {
                    key: 'probability',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'probability',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'closed',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'date_closed',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'type',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'amount',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'big'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'probability',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'date_closed',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'stage',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                },
                                {
                                    key: 'next_step',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Lead': {
            isAttachment:false,
            icon: 'trophy',
            colorType: 'm',
            fields: [
                'salutation',
                'first_name',
                'last_name',
                'description',
                'lead_source',
                'email',
                'fax',
                'phone',
                'phone_mobile',
                'web_url',
                'company_name',
                'industry',
                'annual_revenue',
                'nb_employees',
                'primary_address_city',
                'primary_address_country',
                'primary_address_state',
                'primary_address_street',
                'primary_address_zipcode',
                'is_converted',
                'converted_account_id',
                'converted_contact_id',
                'converted_opportunity_id',
                'converted_date',
                //'currency_iso_code',
                //'rating',
                'assigned_contact_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'assigned_contact_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'converted_account_id', one: 'converted_to', many: 'converted_from', types: ['Account']},
                {key: 'converted_contact_id', one: 'converted_to', many: 'converted_from', types: ['Contact']},
                {key: 'converted_opportunity_id', one: 'converted_to', many: 'converted_from', types: ['Opportunity']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                'salutation': {title: 'htmlFormSalutation', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsSalutation'], optionList: 'htmlOptionsSalutation',
                    validations: [
                                  {expr: 'object.salutation.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormSalutation\', 40])'}
                                //TODO from picklist
                              ]},
                'first_name': {title: 'htmlFormFirstName', type: '', autofocus: true,
                    defaultValue: 'htmlDefaultNewLead',
                    validations: [
                        {expr: 'object.first_name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormFirstName\'])'},
                        {expr: 'object.first_name.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormFirstName\', 40])'}
                    ]},
                'last_name': {title: 'htmlFormLastName', type: '', defaultValue: 'htmlDefaultNewLead',
                    validations: [
                                  {expr: 'object.last_name.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormLastName\'])'},
                                  {expr: 'object.last_name.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormLastName\', 80])'}
                              ]},
                'description': {title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                              ]},
                'lead_source': {title: 'htmlFormLeadSource', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsLeadSource'], optionList: 'htmlOptionsLeadSource',
                    validations: [
                                  {expr: 'object.lead_source.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormLeadSource\', 40])'}
                                  //TODO from picklist
                              ]},
                'email': {title: 'htmlFormEmail', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.email.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormEmail\', 80])'},
                                  {expr: 'object.email.length == 0 || /^[\\w._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(object.email)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorEmailFormat\', [\'htmlFormEmail\'])'}
                              ]},
                'fax': {title: 'htmlFormFax', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.fax.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormFax\', 40])'},
                                  {expr: 'object.fax.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.fax)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormFax\'])'}
                              ]},
                'phone': {title: 'htmlFormPhone', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormPhone\', 40])'},
                                  {expr: 'object.phone.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormPhone\'])'}
                              ]},
                'phone_mobile': {title: 'htmlFormMobile', type: 'tel', defaultValue: '',
                    validations: [
                                  {expr: 'object.phone_mobile.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormMobile\', 40])'},
                                  {expr: 'object.phone_mobile.length == 0 || /^[\\w\\s+()\-\.]{0,40}$/.test(object.phone_mobile)', errorKey: 'Model.createErrMsg(scope, \'htmlErrorPhoneFormat\', [\'htmlFormMobile\'])'}
                              ]},
                'web_url': {title: 'htmlFormWebsite', type: 'url', defaultValue: '',
                    validations: [
                                  {expr: 'object.web_url.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormWebsite\', 255])'}
                              ]},
                'company_name': {title: 'htmlFormCompanyName', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.company_name.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCompanyName\', 255])'}
                              ]},
                'industry': {title: 'htmlFormIndustry', type: 'select', defaultValue: '', defaultSetter: 'firstOptionItem', defaultSetterParam: ['htmlOptionsIndustry'], optionList: 'htmlOptionsIndustry',
                    validations: [
                                  {expr: 'object.industry.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormIndustry\', 40])'}
                              ]},
                'annual_revenue': {title: 'htmlFormAnnualIncome', type: 'currency',
                    defaultValue: 0,
                    validations: [
                        {expr: '/^\\d+$/.test(object.annual_revenue) && object.annual_revenue >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireInteger\', [\'htmlFormAnnualIncome\'])'}
                    ]},
                //'rating',
                'nb_employees': {title: 'htmlFormEmployeeNumber', type: 'number',
                    defaultValue: 0,
                    validations: [
                                  {expr: '/^\\d+$/.test(object.nb_employees) && object.nb_employees >= 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequireInteger\', [\'htmlFormEmployeeNumber\'])'}
                    ]},
                'primary_address_street': {title: 'htmlFormStreet', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_street.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormStreet\', 255])'}
                              ]},
                'primary_address_city': {title: 'htmlFormCity', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_city.length < 40', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCity\', 40])'}
                              ]},
                'primary_address_zipcode': {title: 'htmlFormZipCode', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_zipcode.length < 20', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormZipCode\', 20])'}
                              ]},
                'primary_address_state': {title: 'htmlFormState', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_state.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormState\', 80])'}
                              ]},
                'primary_address_country': {title: 'htmlFormCountry', type: '', defaultValue: '',
                    validations: [
                                  {expr: 'object.primary_address_country.length < 80', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormCountry\', 80])'}
                              ]},
                'is_converted': {title: '', type: 'boolean', defaultValue: false},
                'converted_date': {title: 'htmlFormConvertedDate', type: 'date', defaultValue: ''},
                //'currency_iso_code',
                'created_date': {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                'last_modified_date': {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[
                {
                    key:'web_url',
                    fields: ['web_url'],
                    force:true,
                    getter: 'httpPrefixUrl'
                }
            ],
            editObjectGroups:[
                {
                    key:'details',
                    title: 'htmlFieldsetDetails',
                    fields: ['salutation', 'first_name', 'last_name']
                },
                {
                    key:'contact',
                    title: 'htmlFieldsetContact',
                    fields: ['phone', 'phone_mobile', 'fax', 'email']
                },
                {
                    key:'address',
                    title: 'htmlFieldsetAddress',
                    fields: ['primary_address_street', 'primary_address_city', 'primary_address_zipcode', 'primary_address_state', 'primary_address_country']
                },
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['description', 'lead_source', 'web_url']
                },
                {
                    key:'work',
                    title: 'htmlFieldsetWork',
                    fields: ['company_name', 'annual_revenue', 'nb_employees', 'industry']
                }
            ],
            displayNameList: [
                ['last_name', 'first_name'],
                ['first_name', 'last_name'],
                ['salutation', 'first_name', 'last_name'],
                ['salutation', 'last_name', 'first_name']
            ],
            displayDescription: ['description'],
            displayResumedObjectGroups: [
                {
                    key: 'title',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'company_name',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'web_url',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'phone_mobile',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'email',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: [
                        {
                            key: 'company_name',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'web_url',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: 'small'
                        }
                    ]
                },
                {
                    key: 'phones',
                    synchro: false,
                    icon: false,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'phone',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'phone_mobile',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'email',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'title',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'big'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'company_name',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'web_url',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: 'small'
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'phone',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'phone_mobile',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'email',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'fax',
                                    title: false,
                                    prefix: '',
                                    suffix: 'htmlFormFaxAbbrev',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'c',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlFormTitleContactDetails',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_street',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_city',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'primary_address_zipcode',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'primary_address_state',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'primary_address_country',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: 'htmlFormTitleSegmentation',
                            size: 'big',
                            fields: [
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'industry',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'nb_employees',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'annual_revenue',
                                    title: true,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'lead_source',
                                    title: false,
                                    prefix: 'htmlTextContactOrigin',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'converted_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Document': {
            isAttachment:false,
            icon: 'file',
            colorType: 'j',
            fields: [
                'document_type',
                'name',
                'mimetype',
                'description',
                //'type',
                'length',
                'path',
                'extension',
                'rootname',
                'filePath',
                'fileUrl',
                'parent_id',
                'owner_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
                // TODO : calculate folder, name, ext in client pad
                //$ext = File::generateExtension($attachment['ContentType']);
                //$folder_path = File::generatePath($this->sfApi->getUserId(), ObjModel::WS_SF, $ext);
                //$name = File::generateName($attachment['Name']);
                //$filename = $attachment['Id'] . '.' . $ext;
                //$url = A4P_Environment::getAbsoluteBaseUri() . '/' . $folder_path . $filename;
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Account', 'Contact', 'Event', 'Opportunity'], cascadeDelete: 'many'},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                rootname: {title: 'htmlFormName', type: '', autofocus: true,
                       defaultValue: '',
                       validations: [
                                     {expr: 'object.rootname.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormName\'])'}
                                 ]},
                  //'name': {title: 'htmlFormName', type: '', defaultValue: ''},
                  //'mimetype': {title: 'htmlFormType', type: '', defaultValue: ''},
                  description: {title: 'htmlFormDescription', type: 'textarea', defaultValue: ''},
                  //'type':{title:'htmlFormType', type:''}
                  // length MUST NOT be editable () do not insert it into Model.editObjectGroups),
                  // but we NEED length's type to convert it into a number.
                  length: {title: '', type: 'number', defaultValue: 0},
                  created_date: {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                  last_modified_date: {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[
                {
                    key:'document_type',
                    fields: [],
                    force:false,
                    getter: 'attachmentType'// 'Attachment' by default
                },
                {
                    key:'extension',
                    fields: ['name'],
                    force:false,  // BEWARE : MUST be FALSE to calulate name AFTER extension
                    getter: 'fileExtension'
                },
                {
                    key:'rootname',
                    fields: ['name'],
                    force:false,  // BEWARE : MUST be FALSE to calulate name AFTER rootname
                    getter: 'fileRootname'
                },
                {
                    key:'name',
                    fields: ['rootname', 'extension'],
                    force:true, // BEWARE : MUST be TRUE to force it after edition of rootname & extension
                    getter: 'fileName'
                },
                {
                    key:'mimetype',
                    fields: ['name'],
                    force:false,
                    getter: 'fileFirstMimetype'
                },
                {
                    key:'path',
                    fields: [],
                    force:false,
                    getter: 'dirPath'
                },
                {
                    key:'filePath',
                    fields: ['path', 'id', 'extension'],
                    force:false,
                    getter: 'filePath'
                },
                {
                    key:'fileUrl',
                    fields: ['filePath'],
                    force:false,
                    getter: 'fileUrl'// while waiting for the download of the file (called by addObject())
                }
            ],
            editObjectGroups:[
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['rootname', 'description']
                }
            ],
            displayNameList: [['name']],
            displayDescription: ['description'],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: []
                },
                {
                    key: 'data',
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'created_by_id',
                            title: false,
                            prefix: 'htmlFormCreatedBy',
                            suffix: '',
                            size: ''
                        },
                        {
                            key: 'created_date',
                            title: false,
                            prefix: 'htmlFormCreatedOn',
                            suffix: '',
                            size: ''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Note': {
            isAttachment:false,
            icon: 'comment',
            colorType: 'j',
            fields: [
                'title',
                'when',
                'description',
                'parent_id',
                'owner_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Account', 'Contact', 'Event', 'Opportunity'], cascadeDelete: 'many'},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                title: {
                    title: 'htmlFormTitle', autofocus: true,
                    type: '',
                    defaultValue: '',
                    validations: [
                                  {expr: 'object.title.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormTitle\'])'},
                                  {expr: 'object.title.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormTitle\', 255])'}
                              ]
                },
                description: {
                	title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                              ]
                },
                created_date: {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                last_modified_date: {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[],
            editObjectGroups:[
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['title', 'description']
                }
            ],
            displayNameList: [['title']],
            displayDescription: ['description'],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: []
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        }
                    ]
                },
                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'c',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'message',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Report': {
            isAttachment:false,
            icon: 'book',
            colorType: 'j',
            fields: [
                'title',
                'when',
                'description',
                'message',
                'contact_ids',
                'document_ids',
                'ratings',
                'parent_id',
                'owner_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Account', 'Contact', 'Event', 'Opportunity'], cascadeDelete: 'many'},
                {key: 'contact_ids', one: 'mail_to', many: 'mailed_from', types: ['Contact']},
                {key: 'document_ids', one: 'join_to', many: 'joined_from', types: ['Document']},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields:{
                title: {
                    title: 'htmlFormTitle', autofocus: true,
                    type: '',
                    defaultValue: '',
                    validations: [
                        {expr: 'object.title.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormTitle\'])'},
                        {expr: 'object.title.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormTitle\', 255])'}
                    ]
                },
                description: {
                	title: 'htmlFormDescription', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.description.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormDescription\', 32000])'}
                              ]
                },
                message: {title: 'htmlFormMessage', type: 'textarea', defaultValue: '',
                    validations: [
                                  {expr: 'object.message.length < 32000', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormMessage\', 32000])'}
                              ]
                },
                ratings: {title: 'htmlTextRatings', type: 'rating', defaultValue: {code:'Feeling', name:'Feeling', type:'star', value: 0}},
                created_date: {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                last_modified_date: {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields:[],
            editObjectGroups:[
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['title', 'description', 'message']
                }
            ],
            displayNameList: [['title']],
            displayDescription: ['description'],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: []
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        }
                    ]
                },

                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'description',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'c',
                    brSeparated: true,
                    groups: [
                        {
                            title: 'htmlTitleMailedPeople',
                            size: 'big',
                            fields: [
                                {
                                    key: 'contact_ids',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:' , '
                                }
                            ]
                        },
                        {
                            title: 'htmlTitleJoinedDoc',
                            size: 'big',
                            fields: [
                                {
                                    key: 'document_ids',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:' , '
                                }
                            ]
                        },
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'ratings',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:'br'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'e',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'message',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Plan': {
            isAttachment: false,
            icon: 'reorder',
            colorType: 'j',
            fields: [
                'title',
                'pos',
                'parent_id',
                'owner_id',
                'created_by_id',
                'created_date',
                'last_modified_by_id',
                'last_modified_date'
            ],
            linkFields: [
                {key: 'owner_id', one: 'owner', many: 'owned', types: ['Contact']},
                {key: 'parent_id', one: 'parent', many: 'child', types: ['Event', 'Plan'], cascadeDelete: 'many'},
                {key: 'created_by_id', one: 'creator', many: 'created', types: ['Contact']},
                {key: 'last_modified_by_id', one: 'modifier', many: 'modified', types: ['Contact']}
            ],
            editObjectFields: {
                title: {
                    title: 'htmlFormTitle', autofocus: true,
                    type: '',
                    defaultValue: '',
                    validations: [
                        {expr: 'object.title.length > 0', errorKey: 'Model.createErrMsg(scope, \'htmlErrorRequired\', [\'htmlFormTitle\'])'},
                        {expr: 'object.title.length < 255', errorKey: 'Model.createErrMsg(scope, \'htmlErrorMaxLength\', [\'htmlFormTitle\', 255])'}
                    ]
                },
                //pos: {title: '', type: 'number', defaultValue: 0},
                created_date: {title: 'htmlFormCreatedDate', type: 'date', defaultValue: ''},
                last_modified_date: {title: 'htmlFormLastModifiedDate', type: 'date', defaultValue: ''}
            },
            calculateObjectFields: [],
            editObjectGroups: [
                {
                    key: 'description',
                    title: 'htmlFieldsetDescription',
                    fields: ['title']
                }
            ],
            displayNameList: [['title']],
            displayDescription: [],
            displayResumedObjectGroups: [],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: true,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: false,
                    fields: []
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: true,
                            title: '',
                            size: 'bigger',
                            fields: [
                            ]
                        }
                    ]
                },

                {
                    type: 'd',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: '',
                            fields: [
                                {
                                    key: 'pos',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'z',
                    brSeparated: true,
                    groups: [
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'created_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'created_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        },
                        {
                            title: '',
                            size: 'smaller',
                            fields: [
                                {
                                    key: 'last_modified_by_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                },
                                {
                                    key: 'last_modified_date',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Attachee': {
            isAttachment:true,
            icon: 'file',
            colorType: 'm',
            fields: [
                'event_id',
                'document_id'
            ],
            linkFields: [
                {key: 'event_id', one: 'attached', many: 'attachee', types: ['Account', 'Contact', 'Event', 'Opportunity'], cascadeDelete: 'many'},
                {key: 'document_id', one: 'attachee', many: 'attached', types: ['Document'], cascadeDelete: 'many'}
            ],
            attachee:'document_id',
            attached:'event_id',
            editObjectFields:{},
            calculateObjectFields:[],
            editObjectGroups:[],
            displayNameList: [[]],
            displayDescription: [],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'event_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator:''
                        },
                        {
                            key: 'document_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator:''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: false,
                            title: '',
                            size: 'bigger',
                            fields: [
                                {
                                    key: 'event_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:''
                                },
                                {
                                    key: 'document_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Attendee': {
            isAttachment:true,
            icon: 'user',
            colorType: 'm',
            fields: [
                'event_id',
                'relation_id'
            ],
            linkFields: [
                {key: 'event_id', one: 'attended', many: 'attendee', types: ['Event'], cascadeDelete: 'many'},
                {key: 'relation_id', one: 'attendee', many: 'attended', types: ['Contact'], cascadeDelete: 'many'}
            ],
            attachee:'relation_id',
            attached:'event_id',
            editObjectFields:{},
            calculateObjectFields:[],
            editObjectGroups:[],
            displayNameList:[[]],
            displayDescription: [],
            displayResumedObjectGroups:[],
            displaySummarizedObjectGroups:[
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'event_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator:''
                        },
                        {
                            key: 'relation_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator:''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: false,
                            title: '',
                            size: 'bigger',
                            fields: [
                                {
                                    key: 'event_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:''
                                },
                                {
                                    key: 'relation_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator:''
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        'Plannee': {
            isAttachment: true,
            icon: 'file',
            colorType: 'm',
            fields: [
                'parent_id',
                'object_id'
            ],
            linkFields: [
                {key: 'parent_id', one: 'planned', many: 'plannee', types: ['Event', 'Plan'], cascadeDelete: 'many'},
                {key: 'object_id', one: 'plannee', many: 'planned', types: ['Document', 'Note', 'Report'], cascadeDelete: 'many'}
            ],
            attachee: 'object_id',
            attached: 'parent_id',
            editObjectFields: {},
            calculateObjectFields: [],
            editObjectGroups: [],
            displayNameList: [[]],
            displayDescription: [],
            displayResumedObjectGroups: [],
            displaySummarizedObjectGroups: [
                {
                    key: 'title',
                    synchro: true,
                    icon: true,
                    name: false,
                    title: '',
                    size: '',
                    type: '',
                    brSeparated: true,
                    fields: [
                        {
                            key: 'parent_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator: ''
                        },
                        {
                            key: 'object_id',
                            title: false,
                            prefix: '',
                            suffix: '',
                            size: '',
                            separator: ''
                        }
                    ]
                }
            ],
            displayDetailedObjectCards: [
                {
                    type: 'a',
                    brSeparated: true,
                    groups: [
                        {
                            synchro: true,
                            icon: true,
                            name: false,
                            title: '',
                            size: 'bigger',
                            fields: [
                                {
                                    key: 'parent_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator: ''
                                },
                                {
                                    key: 'object_id',
                                    title: false,
                                    prefix: '',
                                    suffix: '',
                                    size: '',
                                    separator: ''
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    // TODO : merge into Model.a4p_types
    Model.objectArrays = {
        Facet: {facets_ids:true, items_ids:true},
        Contact: {},
        Account: {},
        Event: {},
        Task: {},
        Opportunity: {},
        Lead: {},
        Document: {},
        Note: {},
        Report: {contact_ids:true, document_ids:true, ratings:true},
        Plan: {},
        Attendee: {},
        Attachee: {},
        Plannee: {}
    };

    /**
     * All relations links 3D representation: object -> linked to other object with some link type
     */
    // Order Links by highest priority first for each pair fromType - toType
    Model.allPossibleLinkActionList = [
        //{fromType:'Contact', fromLink:'attendee', toType:'Event'},//invalid directions
        //{fromType:'Event', fromLink:'attended', toType:'Contact'},//invalid directions
        {fromType:'Account', fromLink:'child', toType:'Account'},
        {fromType:'Account', fromLink:'parent', toType:'Account'},

        {fromType:'Account', fromLink:'accounted', toType:'Contact'},

        {fromType:'Account', fromLink:'attachee', toType:'Document'},
        {fromType:'Account', fromLink:'child', toType:'Document'},

        {fromType:'Account', fromLink:'affected', toType:'Event'},

        {fromType:'Account', fromLink:'faceter', toType:'Facet'},

        {fromType:'Account', fromLink:'child', toType:'Note'},

        {fromType:'Account', fromLink:'accounted', toType:'Opportunity'},

        {fromType:'Account', fromLink:'child', toType:'Report'},

        {fromType:'Account', fromLink:'affected', toType:'Task'},

        {fromType:'Contact', fromLink:'accounter', toType:'Account'},

        {fromType:'Contact', fromLink:'manager', toType:'Contact'},
        {fromType:'Contact', fromLink:'managed', toType:'Contact'},

        {fromType:'Contact', fromLink:'attachee', toType:'Document'},
        {fromType:'Contact', fromLink:'child', toType:'Document'},

        {fromType:'Contact', fromLink:'attended', toType:'Event'},
        {fromType:'Contact', fromLink:'led', toType:'Event'},

        {fromType:'Contact', fromLink:'faceter', toType:'Facet'},

        {fromType:'Contact', fromLink:'child', toType:'Note'},

        {fromType:'Contact', fromLink:'accounted', toType:'Opportunity'},

        {fromType:'Contact', fromLink:'mailed_from', toType:'Report'},
        {fromType:'Contact', fromLink:'child', toType:'Report'},

        {fromType:'Contact', fromLink:'led', toType:'Task'},

        {fromType:'Document', fromLink:'attached', toType:'Account'},
        {fromType:'Document', fromLink:'parent', toType:'Account'},

        {fromType:'Document', fromLink:'attached', toType:'Contact'},
        {fromType:'Document', fromLink:'parent', toType:'Contact'},

        {fromType:'Document', fromLink:'attached', toType:'Event'},
        {fromType: 'Document', fromLink: 'planned', toType: 'Event'},
        {fromType:'Document', fromLink:'parent', toType:'Event'},

        {fromType:'Document', fromLink:'faceter', toType:'Facet'},

        {fromType:'Document', fromLink:'attached', toType:'Opportunity'},
        {fromType:'Document', fromLink:'parent', toType:'Opportunity'},

        {fromType: 'Document', fromLink: 'planned', toType: 'Plan'},

        {fromType:'Document', fromLink:'joined_from', toType:'Report'},

        {fromType:'Event', fromLink:'affecter', toType:'Account'},

        {fromType:'Event', fromLink:'attendee', toType:'Contact'},
        {fromType:'Event', fromLink:'leader', toType:'Contact'},

        {fromType:'Event', fromLink:'attachee', toType:'Document'},
        {fromType: 'Event', fromLink: 'plannee', toType: 'Document'},
        {fromType:'Event', fromLink:'child', toType:'Document'},

        {fromType:'Event', fromLink:'faceter', toType:'Facet'},

        {fromType: 'Event', fromLink: 'plannee', toType: 'Note'},
        {fromType:'Event', fromLink:'child', toType:'Note'},

        {fromType:'Event', fromLink:'affecter', toType:'Opportunity'},

        {fromType: 'Event', fromLink: 'child', toType: 'Plan'},

        {fromType: 'Event', fromLink: 'plannee', toType: 'Report'},
        {fromType:'Event', fromLink:'child', toType:'Report'},

        {fromType:'Facet', fromLink:'faceted', toType:'Account'},

        {fromType:'Facet', fromLink:'faceted', toType:'Contact'},

        {fromType:'Facet', fromLink:'faceted', toType:'Document'},

        {fromType:'Facet', fromLink:'faceted', toType:'Event'},

        {fromType:'Facet', fromLink:'child', toType:'Facet'},
        {fromType:'Facet', fromLink:'parent', toType:'Facet'},

        {fromType:'Facet', fromLink:'faceted', toType:'Lead'},

        {fromType:'Facet', fromLink:'faceted', toType:'Opportunity'},

        {fromType:'Facet', fromLink:'faceted', toType:'Task'},

        {fromType:'Lead', fromLink:'faceter', toType:'Facet'},

        {fromType:'Note', fromLink:'parent', toType:'Account'},

        {fromType:'Note', fromLink:'parent', toType:'Contact'},

        {fromType: 'Note', fromLink: 'planned', toType: 'Event'},
        {fromType:'Note', fromLink:'parent', toType:'Event'},

        {fromType:'Note', fromLink:'parent', toType:'Opportunity'},

        {fromType: 'Note', fromLink: 'planned', toType: 'Plan'},

        {fromType:'Opportunity', fromLink:'accounter', toType:'Account'},

        {fromType:'Opportunity', fromLink:'accounter', toType:'Contact'},

        {fromType:'Opportunity', fromLink:'attachee', toType:'Document'},
        {fromType:'Opportunity', fromLink:'child', toType:'Document'},

        {fromType:'Opportunity', fromLink:'affected', toType:'Event'},

        {fromType:'Opportunity', fromLink:'faceter', toType:'Facet'},

        {fromType:'Opportunity', fromLink:'child', toType:'Note'},

        {fromType:'Opportunity', fromLink:'child', toType:'Report'},

        {fromType:'Opportunity', fromLink:'affected', toType:'Task'},

        {fromType: 'Plan', fromLink: 'plannee', toType: 'Document'},

        {fromType: 'Plan', fromLink: 'parent', toType: 'Event'},

        {fromType: 'Plan', fromLink: 'plannee', toType: 'Note'},

        {fromType: 'Plan', fromLink: 'parent', toType: 'Plan'},
        {fromType: 'Plan', fromLink: 'child', toType: 'Plan'},

        {fromType: 'Plan', fromLink: 'plannee', toType: 'Report'},

        {fromType: 'Report', fromLink: 'parent', toType: 'Account'},

        {fromType:'Report', fromLink:'mail_to', toType:'Contact'},
        {fromType:'Report', fromLink:'parent', toType:'Contact'},

        {fromType:'Report', fromLink:'join_to', toType:'Document'},

        {fromType: 'Report', fromLink: 'planned', toType: 'Event'},
        {fromType:'Report', fromLink:'parent', toType:'Event'},

        {fromType:'Report', fromLink:'parent', toType:'Opportunity'},

        {fromType: 'Report', fromLink: 'planned', toType: 'Plan'},

        {fromType:'Task', fromLink:'affecter', toType:'Account'},

        {fromType:'Task', fromLink:'leader', toType:'Contact'},

        {fromType:'Task', fromLink:'faceter', toType:'Facet'},

        {fromType:'Task', fromLink:'affecter', toType:'Opportunity'}
    ];


    // Calculate some other properties

    Model.linkActionMap = {};
    for (var i = 0, n = Model.allPossibleLinkActionList.length; i < n; i++) {
        var desc = Model.allPossibleLinkActionList[i];
        if (a4p.isUndefined(Model.linkActionMap[desc.fromType])) {
            Model.linkActionMap[desc.fromType] = {};
        }
        if (a4p.isUndefined(Model.linkActionMap[desc.fromType][desc.toType])) {
            Model.linkActionMap[desc.fromType][desc.toType] = [];
        }
        Model.linkActionMap[desc.fromType][desc.toType].push(desc.fromLink);
    }

    Model.allTypes = [];// all types
    Model.objectTypes = [];// type list for objects only
    Model.attachTypes = [];// type list for attachments only
    Model.isAttachType = {};// type dictionary for attachments only
    Model.isAutonomousType = {};// type map for objects creatable without parent

    for (var a4p_type in Model.a4p_types) {
        if (!Model.a4p_types.hasOwnProperty(a4p_type)) continue;
        var desc = Model.a4p_types[a4p_type];
        desc.displayName = desc.displayNameList[0] || [];
        if (desc.isAttachment) {
            Model.attachTypes.push(a4p_type);
            // attachTypes accessed by key instead of array browsing
            Model.isAttachType[a4p_type] = true;
        } else {
            Model.objectTypes.push(a4p_type);
            Model.isAttachType[a4p_type] = false;
        }
        Model.allTypes.push(a4p_type);

        desc.isAutonomousType = true;
        // linkFields accessed by key instead of array browsing
        desc.linkDescs = {};
        for (var linkIdx=0; linkIdx<desc.linkFields.length; linkIdx++) {
            var linkDesc = desc.linkFields[linkIdx];
            desc.linkDescs[linkDesc.key] = linkDesc;
            if ((linkDesc.cascadeDelete == 'many') && !((linkDesc.types.length == 1) && (linkDesc.types[0] == a4p_type))) {
                desc.isAutonomousType = false;
            }
        }
    }

    // helper functions

    Model.formatEventName = function (date_start, name) {
        var date = '';
        if (date_start) date = date_start.substring(0, 16);
        name = date + ' ' + name;
        return name;
    };

    Model.getTypeIcon = function (type){
        var result = '';
        if (type && a4p.isDefined(Model.a4p_types[type])) {
            result = Model.a4p_types[type].icon;
        }
        return result;
    };

    Model.getTypeColor = function (type){
        var result = '';
        if (type && a4p.isDefined(Model.a4p_types[type])) {
            result = Model.a4p_types[type].colorType;
        }
        return result;
    };

    Model.getItemIcon = function (item){
        var result = '';
        if ((item != null) && a4p.isDefined(Model.a4p_types[item.a4p_type])) {
            result = Model.a4p_types[item.a4p_type].icon;
        }
        return result;
    };

    Model.getItemHtmlDescription = function (item) {
        var result = '';
        if ((item != null) && a4p.isDefined(Model.a4p_types[item.a4p_type])) {
            // concat names
            for (var fieldNameIdx = 0; fieldNameIdx < Model.a4p_types[item.a4p_type].displayDescription.length; fieldNameIdx++) {
                var fieldName = Model.a4p_types[item.a4p_type].displayDescription[fieldNameIdx];
                result = result + ' ' + item[fieldName];
            }
            result = '<p>'+result.trim()+'</p>';
        }
        return result;
    };

    /**
     * List of objects of file type (i.e. data stored in fileStorage and transfered with FileTransfer)
     * @type {Array}
     */
    Model.files = {
        Document: {
            filePath: 'filePath',
            fileName: 'name',
            fileExtension: 'extension',
            parent: 'parent_id'
        }
    };

    // Update synchronously this array with l4p/src/php/c4p/common/Model.php
    Model.mimetypes = {
        '3dm': ['x-world/x-3dmf'],
        '3dmf': ['x-world/x-3dmf'],
        'a': ['application/octet-stream'],
        'aab': ['application/x-authorware-bin'],
        'aam': ['application/x-authorware-map'],
        'aas': ['application/x-authorware-seg'],
        'abc': ['text/vnd.abc'],
        'acgi': ['text/html'],
        'afl': ['video/animaflex'],
        'ai': ['application/postscript'],
        'aif': ['audio/aiff', 'audio/x-aiff'],
        'aifc': ['audio/aiff', 'audio/x-aiff'],
        'aiff': ['audio/aiff', 'audio/x-aiff'],
        'aim': ['application/x-aim'],
        'aip': ['text/x-audiosoft-intra'],
        'ani': ['application/x-navi-animation'],
        'aos': ['application/x-nokia-9000-communicator-add-on-software'],
        'aps': ['application/mime'],
        'arc': ['application/octet-stream'],
        'arj': ['application/arj', 'application/octet-stream'],
        'art': ['image/x-jg'],
        'asf': ['video/x-ms-asf'],
        'asm': ['text/x-asm'],
        'asp': ['text/asp'],
        'asx': ['application/x-mplayer2', 'video/x-ms-asf', 'video/x-ms-asf-plugin'],
        'au': ['audio/basic', 'audio/x-au'],
        'avi': ['video/avi', 'video/msvideo', 'video/x-msvideo', 'application/x-troff-msvideo'],
        'avs': ['video/avs-video'],
        'bcpio': ['application/x-bcpio'],
        'bin': ['application/octet-stream', 'application/mac-binary', 'application/macbinary', 'application/x-binary', 'application/x-macbinary'],
        'bm': ['image/bmp'],
        'bmp': ['image/bmp', 'image/x-windows-bmp'],
        'boo': ['application/book'],
        'book': ['application/book'],
        'boz': ['application/x-bzip2'],
        'bsh': ['application/x-bsh'],
        'bz': ['application/x-bzip'],
        'bz2': ['application/x-bzip2'],
        'c': ['text/plain', 'text/x-c'],
        'c++': ['text/plain'],
        'cat': ['application/vnd.ms-pki.seccat'],
        'cc': ['text/plain', 'text/x-c'],
        'ccad': ['application/clariscad'],
        'cco': ['application/x-cocoa'],
        'cdf': ['application/cdf', 'application/x-cdf', 'application/x-netcdf'],
        'cer': ['application/pkix-cert', 'application/x-x509-ca-cert'],
        'cha': ['application/x-chat'],
        'chat': ['application/x-chat'],
        'class': ['application/java', 'application/java-byte-code', 'application/x-java-class'],
        'com': ['application/octet-stream', 'text/plain'],
        'conf': ['text/plain'],
        'cpio': ['application/x-cpio'],
        'cpp': ['text/x-c'],
        'cpt': ['application/mac-compactpro', 'application/x-compactpro', 'application/x-cpt'],
        'crl': ['application/pkcs-crl', 'application/pkix-crl'],
        'crt': ['application/pkix-cert', 'application/x-x509-ca-cert', 'application/x-x509-user-cert'],
        'csh': ['application/x-csh', 'text/x-script.csh'],
        'css': ['application/x-pointplus', 'text/css'],
        'cxx': ['text/plain'],
        'dcr': ['application/x-director'],
        'deepv': ['application/x-deepv'],
        'def': ['text/plain'],
        'der': ['application/x-x509-ca-cert'],
        'dif': ['video/x-dv'],
        'dir': ['application/x-director'],
        'dl': ['video/dl', 'video/x-dl'],
        'doc': ['application/msword'],
        'docx': ['application/msword'],
        // TODO : doc and docx have vnd.openxmlformats-officedocument.wordprocessingml.document
        'dot': ['application/msword'],
        'dp': ['application/commonground'],
        'drw': ['application/drafting'],
        'dump': ['application/octet-stream'],
        'dv': ['video/x-dv'],
        'dvi': ['application/x-dvi'],
        'dwf': ['drawing/x-dwf', 'model/vnd.dwf'],
        'dwg': ['application/acad', 'image/vnd.dwg', 'image/x-dwg'],
        'dxf': ['application/dxf', 'image/vnd.dwg', 'image/x-dwg'],
        'dxr': ['application/x-director'],
        'el': ['text/x-script.elisp'],
        'elc': ['application/x-bytecode.elisp', 'application/x-elc'],
        'env': ['application/x-envoy'],
        'eps': ['application/postscript'],
        'es': ['application/x-esrehber'],
        'etx': ['text/x-setext'],
        'evy': ['application/envoy', 'application/x-envoy'],
        'exe': ['application/octet-stream'],
        'f': ['text/plain', 'text/x-fortran'],
        'f77': ['text/x-fortran'],
        'f90': ['text/plain', 'text/x-fortran'],
        'fdf': ['application/vnd.fdf'],
        'fif': ['application/fractals', 'image/fif'],
        'fli': ['video/fli', 'video/x-fli'],
        'flo': ['image/florian'],
        'flx': ['text/vnd.fmi.flexstor'],
        'fmf': ['video/x-atomic3d-feature'],
        'for': ['text/plain', 'text/x-fortran'],
        'fpx': ['image/vnd.fpx', 'image/vnd.net-fpx'],
        'frl': ['application/freeloader'],
        'funk': ['audio/make'],
        'g': ['text/plain'],
        'g3': ['image/g3fax'],
        'gif': ['image/gif'],
        'gl': ['video/gl', 'video/x-gl'],
        'gsd': ['audio/x-gsm'],
        'gsm': ['audio/x-gsm'],
        'gsp': ['application/x-gsp'],
        'gss': ['application/x-gss'],
        'gtar': ['application/x-gtar'],
        'gz': ['application/x-compressed', 'application/x-gzip'],
        'gzip': ['application/x-gzip', 'multipart/x-gzip'],
        'h': ['text/plain', 'text/x-h'],
        'hdf': ['application/x-hdf'],
        'help': ['application/x-helpfile'],
        'hgl': ['application/vnd.hp-hpgl'],
        'hh': ['text/plain', 'text/x-h'],
        'hlb': ['text/x-script'],
        'hlp': ['application/hlp', 'application/x-helpfile', 'application/x-winhelp'],
        'hpg': ['application/vnd.hp-hpgl'],
        'hpgl': ['application/vnd.hp-hpgl'],
        'hqx': ['application/binhex', 'application/binhex4', 'application/mac-binhex', 'application/mac-binhex40', 'application/x-binhex40', 'application/x-mac-binhex40'],
        'hta': ['application/hta'],
        'htc': ['text/x-component'],
        'htm': ['text/html'],
        'html': ['text/html'],
        'htmls': ['text/html'],
        'htt': ['text/webviewhtml'],
        'htx': ['text/html'],
        'ice': ['x-conference/x-cooltalk'],
        'ico': ['image/x-icon'],
        'idc': ['text/plain'],
        'ief': ['image/ief'],
        'iefs': ['image/ief'],
        'iges': ['application/iges', 'model/iges'],
        'igs': ['application/iges', 'model/iges'],
        'ima': ['application/x-ima'],
        'imap': ['application/x-httpd-imap'],
        'inf': ['application/inf'],
        'ins': ['application/x-internett-signup'],
        'ip': ['application/x-ip2'],
        'isu': ['video/x-isvideo'],
        'it': ['audio/it'],
        'iv': ['application/x-inventor'],
        'ivr': ['i-world/i-vrml'],
        'ivy': ['application/x-livescreen'],
        'jam': ['audio/x-jam'],
        'jav': ['text/plain', 'text/x-java-source'],
        'java': ['text/plain', 'text/x-java-source'],
        'jcm': ['application/x-java-commerce'],
        'jfif': ['image/jpeg', 'image/pjpeg'],
        'jfif-tbnl': ['image/jpeg'],
        'jpe': ['image/jpeg', 'image/pjpeg'],
        'jpeg': ['image/jpeg', 'image/pjpeg'],
        'jpg': ['image/jpeg', 'image/pjpeg'],
        'jps': ['image/x-jps'],
        'js': ['application/x-javascript'],
        'jut': ['image/jutvision'],
        'kar': ['audio/midi', 'music/x-karaoke'],
        'ksh': ['application/x-ksh', 'text/x-script.ksh'],
        'la': ['audio/nspaudio', 'audio/x-nspaudio'],
        'lam': ['audio/x-liveaudio'],
        'latex': ['application/x-latex'],
        'lha': ['application/lha', 'application/octet-stream', 'application/x-lha'],
        'lhx': ['application/octet-stream'],
        'list': ['text/plain'],
        'lma': ['audio/nspaudio', 'audio/x-nspaudio'],
        'log': ['text/plain'],
        'lsp': ['application/x-lisp', 'text/x-script.lisp'],
        'lst': ['text/plain'],
        'lsx': ['text/x-la-asf'],
        'ltx': ['application/x-latex'],
        'lzh': ['application/octet-stream', 'application/x-lzh'],
        'lzx': ['application/lzx', 'application/octet-stream', 'application/x-lzx'],
        'm': ['text/plain', 'text/x-m'],
        'm1v': ['video/mpeg'],
        'm2a': ['audio/mpeg'],
        'm2v': ['video/mpeg'],
        'm3u': ['audio/x-mpequrl'],
        'man': ['application/x-troff-man'],
        'map': ['application/x-navimap'],
        'mar': ['text/plain'],
        'mbd': ['application/mbedlet'],
        'mc$': ['application/x-magic-cap-package-1.0'],
        'mcd': ['application/mcad', 'application/x-mathcad'],
        'mcf': ['image/vasa', 'text/mcf'],
        'mcp': ['application/netmc'],
        'me': ['application/x-troff-me'],
        'mht': ['message/rfc822'],
        'mhtml': ['message/rfc822'],
        'mid': ['application/x-midi', 'audio/midi', 'audio/x-mid', 'audio/x-midi', 'music/crescendo', 'x-music/x-midi'],
        'midi': ['application/x-midi', 'audio/midi', 'audio/x-mid', 'audio/x-midi', 'music/crescendo', 'x-music/x-midi'],
        'mif': ['application/x-frame', 'application/x-mif'],
        'mime': ['message/rfc822', 'www/mime'],
        'mjf': ['audio/x-vnd.audioexplosion.mjuicemediafile'],
        'mjpg': ['video/x-motion-jpeg'],
        'mm': ['application/base64', 'application/x-meme'],
        'mme': ['application/base64'],
        'mod': ['audio/mod', 'audio/x-mod'],
        'moov': ['video/quicktime'],
        'mov': ['video/quicktime'],
        'movie': ['video/x-sgi-movie'],
        'mp2': ['audio/mpeg', 'audio/x-mpeg', 'video/mpeg', 'video/x-mpeg', 'video/x-mpeq2a'],
        'mp3': ['audio/mpeg3', 'audio/x-mpeg-3', 'video/mpeg', 'video/x-mpeg'],
        'mp4': ['video/mp4'],
        'mpa': ['audio/mpeg', 'video/mpeg'],
        'mpc': ['application/x-project'],
        'mpe': ['video/mpeg'],
        'mpeg': ['video/mpeg'],
        'mpg': ['audio/mpeg', 'video/mpeg'],
        'mpga': ['audio/mpeg'],
        'mpp': ['application/vnd.ms-project'],
        'mpt': ['application/x-project'],
        'mpv': ['application/x-project'],
        'mpx': ['application/x-project'],
        'mrc': ['application/marc'],
        'ms': ['application/x-troff-ms'],
        'mv': ['video/x-sgi-movie'],
        'my': ['audio/make'],
        'mzz': ['application/x-vnd.audioexplosion.mzz'],
        'nap': ['image/naplps'],
        'naplps': ['image/naplps'],
        'nc': ['application/x-netcdf'],
        'ncm': ['application/vnd.nokia.configuration-message'],
        'nif': ['image/x-niff'],
        'niff': ['image/x-niff'],
        'nix': ['application/x-mix-transfer'],
        'nsc': ['application/x-conference'],
        'nvd': ['application/x-navidoc'],
        'o': ['application/octet-stream'],
        'oda': ['application/oda'],
        'ogv': ['video/ogg'],
        'omc': ['application/x-omc'],
        'omcd': ['application/x-omcdatamaker'],
        'omcr': ['application/x-omcregerator'],
        'p': ['text/x-pascal'],
        'p10': ['application/pkcs10', 'application/x-pkcs10'],
        'p12': ['application/pkcs-12', 'application/x-pkcs12'],
        'p7a': ['application/x-pkcs7-signature'],
        'p7c': ['application/pkcs7-mime', 'application/x-pkcs7-mime'],
        'p7m': ['application/pkcs7-mime', 'application/x-pkcs7-mime'],
        'p7r': ['application/x-pkcs7-certreqresp'],
        'p7s': ['application/pkcs7-signature'],
        'part': ['application/pro_eng'],
        'pas': ['text/pascal'],
        'pbm': ['image/x-portable-bitmap'],
        'pcl': ['application/vnd.hp-pcl', 'application/x-pcl'],
        'pct': ['image/x-pict'],
        'pcx': ['image/x-pcx'],
        'pdb': ['chemical/x-pdb'],
        'pdf': ['application/pdf'],
        'pfunk': ['audio/make', 'audio/make.my.funk'],
        'pgm': ['image/x-portable-graymap', 'image/x-portable-greymap'],
        'pic': ['image/pict'],
        'pict': ['image/pict'],
        'pkg': ['application/x-newton-compatible-pkg'],
        'pko': ['application/vnd.ms-pki.pko'],
        'pl': ['text/plain', 'text/x-script.perl'],
        'plx': ['application/x-pixclscript'],
        'pm': ['image/x-xpixmap', 'text/x-script.perl-module'],
        'pm4': ['application/x-pagemaker'],
        'pm5': ['application/x-pagemaker'],
        'png': ['image/png'],
        'pnm': ['application/x-portable-anymap', 'image/x-portable-anymap'],
        'pot': ['application/mspowerpoint', 'application/vnd.ms-powerpoint'],
        'pov': ['model/x-pov'],
        'ppa': ['application/vnd.ms-powerpoint'],
        'ppm': ['image/x-portable-pixmap'],
        'pps': ['application/mspowerpoint', 'application/vnd.ms-powerpoint'],
        'ppt': ['application/mspowerpoint', 'application/powerpoint', 'application/vnd.ms-powerpoint', 'application/x-mspowerpoint'],
        // TODO : ppt has vnd.ms-powerpoint, vnd.openxmlformats-officedocument.presentationml.presentation
        'ppz': ['application/mspowerpoint'],
        'pre': ['application/x-freelance'],
        'prt': ['application/pro_eng'],
        'ps': ['application/postscript'],
        'psd': ['application/octet-stream'],
        'pvu': ['paleovu/x-pv'],
        'pwz': ['application/vnd.ms-powerpoint'],
        'py': ['text/x-script.phyton'],
        'pyc': ['applicaiton/x-bytecode.python'],
        'qcp': ['audio/vnd.qcelp'],
        'qd3': ['x-world/x-3dmf'],
        'qd3d': ['x-world/x-3dmf'],
        'qif': ['image/x-quicktime'],
        'qt': ['video/quicktime'],
        'qtc': ['video/x-qtc'],
        'qti': ['image/x-quicktime'],
        'qtif': ['image/x-quicktime'],
        'ra': ['audio/x-pn-realaudio', 'audio/x-pn-realaudio-plugin', 'audio/x-realaudio'],
        'ram': ['audio/x-pn-realaudio'],
        'ras': ['application/x-cmu-raster', 'image/cmu-raster', 'image/x-cmu-raster'],
        'rast': ['image/cmu-raster'],
        'rexx': ['text/x-script.rexx'],
        'rf': ['image/vnd.rn-realflash'],
        'rgb': ['image/x-rgb'],
        'rm': ['application/vnd.rn-realmedia', 'audio/x-pn-realaudio'],
        'rmi': ['audio/mid'],
        'rmm': ['audio/x-pn-realaudio'],
        'rmp': ['audio/x-pn-realaudio', 'audio/x-pn-realaudio-plugin'],
        'rng': ['application/ringing-tones', 'application/vnd.nokia.ringing-tone'],
        'rnx': ['application/vnd.rn-realplayer'],
        'roff': ['application/x-troff'],
        'rp': ['image/vnd.rn-realpix'],
        'rpm': ['audio/x-pn-realaudio-plugin'],
        'rt': ['text/richtext', 'text/vnd.rn-realtext'],
        'rtf': ['application/rtf', 'application/x-rtf', 'text/richtext'],
        'rtx': ['application/rtf', 'text/richtext'],
        'rv': ['video/vnd.rn-realvideo'],
        's': ['text/x-asm'],
        's3m': ['audio/s3m'],
        'saveme': ['application/octet-stream'],
        'sbk': ['application/x-tbook'],
        'scm': ['application/x-lotusscreencam', 'text/x-script.guile', 'text/x-script.scheme', 'video/x-scm'],
        'sdml': ['text/plain'],
        'sdp': ['application/sdp', 'application/x-sdp'],
        'sdr': ['application/sounder'],
        'sea': ['application/sea', 'application/x-sea'],
        'set': ['application/set'],
        'sgm': ['text/sgml', 'text/x-sgml'],
        'sgml': ['text/sgml', 'text/x-sgml'],
        'sh': ['application/x-bsh', 'application/x-sh', 'application/x-shar', 'text/x-script.sh'],
        'shar': ['application/x-bsh', 'application/x-shar'],
        'shtml': ['text/html', 'text/x-server-parsed-html'],
        'sid': ['audio/x-psid'],
        'sit': ['application/x-sit', 'application/x-stuffit'],
        'skd': ['application/x-koan'],
        'skm': ['application/x-koan'],
        'skp': ['application/x-koan'],
        'skt': ['application/x-koan'],
        'sl': ['application/x-seelogo'],
        'smi': ['application/smil'],
        'smil': ['application/smil'],
        'snd': ['audio/basic', 'audio/x-adpcm'],
        'sol': ['application/solids'],
        'spc': ['application/x-pkcs7-certificates', 'text/x-speech'],
        'spl': ['application/futuresplash'],
        'spr': ['application/x-sprite'],
        'sprite': ['application/x-sprite'],
        'src': ['application/x-wais-source'],
        'ssi': ['text/x-server-parsed-html'],
        'ssm': ['application/streamingmedia'],
        'sst': ['application/vnd.ms-pki.certstore'],
        'step': ['application/step'],
        'stl': ['application/sla', 'application/vnd.ms-pki.stl', 'application/x-navistyle'],
        'stp': ['application/step'],
        'sv4cpio': ['application/x-sv4cpio'],
        'sv4crc': ['application/x-sv4crc'],
        'svf': ['image/vnd.dwg', 'image/x-dwg'],
        'svr': ['application/x-world', 'x-world/x-svr'],
        'swf': ['application/x-shockwave-flash'],
        't': ['application/x-troff'],
        'talk': ['text/x-speech'],
        'tar': ['application/x-tar'],
        'tbk': ['application/toolbook', 'application/x-tbook'],
        'tcl': ['application/x-tcl', 'text/x-script.tcl'],
        'tcsh': ['text/x-script.tcsh'],
        'tex': ['application/x-tex'],
        'texi': ['application/x-texinfo'],
        'texinfo': ['application/x-texinfo'],
        'text': ['application/plain', 'text/plain'],
        'tgz': ['application/gnutar', 'application/x-compressed'],
        'tif': ['image/tiff', 'image/x-tiff'],
        'tiff': ['image/tiff', 'image/x-tiff'],
        'tr': ['application/x-troff'],
        'tsi': ['audio/tsp-audio'],
        'tsp': ['application/dsptype', 'audio/tsplayer'],
        'tsv': ['text/tab-separated-values'],
        'turbot': ['image/florian'],
        'txt': ['text/plain'],
        'uil': ['text/x-uil'],
        'uni': ['text/uri-list'],
        'unis': ['text/uri-list'],
        'unv': ['application/i-deas'],
        'uri': ['text/uri-list'],
        'uris': ['text/uri-list'],
        'ustar': ['application/x-ustar', 'multipart/x-ustar'],
        'uu': ['application/octet-stream', 'text/x-uuencode'],
        'uue': ['text/x-uuencode'],
        'vcd': ['application/x-cdlink'],
        'vcs': ['text/x-vcalendar'],
        'vda': ['application/vda'],
        'vdo': ['video/vdo'],
        'vew': ['application/groupwise'],
        'viv': ['video/vivo', 'video/vnd.vivo'],
        'vivo': ['video/vivo', 'video/vnd.vivo'],
        'vmd': ['application/vocaltec-media-desc'],
        'vmf': ['application/vocaltec-media-file'],
        'voc': ['audio/voc', 'audio/x-voc'],
        'vos': ['video/vosaic'],
        'vox': ['audio/voxware'],
        'vqe': ['audio/x-twinvq-plugin'],
        'vqf': ['audio/x-twinvq'],
        'vql': ['audio/x-twinvq-plugin'],
        'vrml': ['application/x-vrml', 'model/vrml', 'x-world/x-vrml'],
        'vrt': ['x-world/x-vrt'],
        'vsd': ['application/x-visio'],
        'vst': ['application/x-visio'],
        'vsw': ['application/x-visio'],
        'w60': ['application/wordperfect6.0'],
        'w61': ['application/wordperfect6.1'],
        'w6w': ['application/msword'],
        'wav': ['audio/wav', 'audio/x-wav'],
        'wb1': ['application/x-qpro'],
        'wbmp': ['image/vnd.wap.wbmp'],
        'web': ['application/vnd.xara'],
        'webm': ['video/webm'],
        'wiz': ['application/msword'],
        'wk1': ['application/x-123'],
        'wmf': ['windows/metafile'],
        'wml': ['text/vnd.wap.wml'],
        'wmlc': ['application/vnd.wap.wmlc'],
        'wmls': ['text/vnd.wap.wmlscript'],
        'wmlsc': ['application/vnd.wap.wmlscriptc'],
        'word': ['application/msword'],
        'wp': ['application/wordperfect'],
        'wp5': ['application/wordperfect', 'application/wordperfect6.0'],
        'wp6': ['application/wordperfect'],
        'wpd': ['application/wordperfect', 'application/x-wpwin'],
        'wq1': ['application/x-lotus'],
        'wri': ['application/mswrite', 'application/x-wri'],
        'wrl': ['application/x-world', 'model/vrml', 'x-world/x-vrml'],
        'wrz': ['model/vrml', 'x-world/x-vrml'],
        'wsc': ['text/scriplet'],
        'wsrc': ['application/x-wais-source'],
        'wtk': ['application/x-wintalk'],
        'xbm': ['image/x-xbitmap', 'image/x-xbm', 'image/xbm'],
        'xdr': ['video/x-amt-demorun'],
        'xgz': ['xgl/drawing'],
        'xif': ['image/vnd.xiff'],
        'xl': ['application/excel'],
        'xla': ['application/excel', 'application/x-excel', 'application/x-msexcel'],
        'xlb': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel'],
        'xlc': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel'],
        'xld': ['application/excel', 'application/x-excel'],
        'xlk': ['application/excel', 'application/x-excel'],
        'xll': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel'],
        'xlm': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel'],
        'xls': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel', 'application/x-msexcel'],
        // TODO : xls has vnd.ms-excel,vnd.openxmlformats-officedocument.spreadsheetml.sheet
        'xlt': ['application/excel', 'application/x-excel'],
        'xlv': ['application/excel', 'application/x-excel'],
        'xlw': ['application/excel', 'application/vnd.ms-excel', 'application/x-excel', 'application/x-msexcel'],
        'xm': ['audio/xm'],
        'xml': ['application/xml', 'text/xml'],
        'xmz': ['xgl/movie'],
        'xpix': ['application/x-vnd.ls-xpix'],
        'xpm': ['image/x-xpixmap', 'image/xpm'],
        'x-png': ['image/png'],
        'xsr': ['video/x-amt-showrun'],
        'xwd': ['image/x-xwd', 'image/x-xwindowdump'],
        'xyz': ['chemical/x-pdb'],
        'z': ['application/x-compress', 'application/x-compressed'],
        'zip': ['application/x-compressed', 'application/x-zip-compressed', 'application/zip', 'multipart/x-zip'],
        'zoo': ['application/octet-stream'],
        'zsh': ['text/x-script.zsh']
    };

    Model.isImage = function (fileExtension) {
        var mimeTypes = Model.mimetypes[fileExtension];
        if (a4p.isUndefined(mimeTypes)) return false;
        for (var i = 0, len = mimeTypes.length; i < len; i++) {
            //if (mimeTypes[i].substr(0, 6) == 'image/') return true;
            if (mimeTypes[i] == 'image/png') return true;
            //if (mimeTypes[i] == 'image/xpm') return true;
            //if (mimeTypes[i] == 'image/xbm') return true;
            //if (mimeTypes[i] == 'image/tiff') return true;
            if (mimeTypes[i] == 'image/jpeg') return true;
            if (mimeTypes[i] == 'image/gif') return true;
            if (mimeTypes[i] == 'image/bmp') return true;
            //if (mimeTypes[i] == 'image/x-portable-bitmap') return true;
        }
        return false;
    };

    Model.isVideo = function(fileExtension) {
        var mimeTypes = Model.mimetypes[fileExtension];
        if (a4p.isUndefined(mimeTypes)) return false;
        for (var i = 0, len = mimeTypes.length; i < len; i++) {
            if (mimeTypes[i] == 'video/mp4') return true;
            if (mimeTypes[i] == 'video/ogg') return true;
            if (mimeTypes[i] == 'video/webm') return true;
        }
        return false;
    };

    Model.getErrorMsg = function (scope, errorExpr) {
    	// errorExpr calls Model.createErrMsg function
    	return eval(errorExpr);
    };

    Model.createErrMsg = function (scope, errorKey, valuesArr) {
    	var errMsg = Model.translate(scope, errorKey);

    	for(var i = 0;i<valuesArr.length;i++) {
    		errMsg = errMsg.replace('{' + i + '}', Model.translate(scope, valuesArr[i]));
    	}

    	return errMsg;
    };

    Model.translate = function (scope, key) {
    	var translated = scope.srvLocale.translations[key];

    	if(translated != undefined) return translated;

    	return key;
    };

    Model.validateObject = function (object, expr) {
        // object var name MUST be 'object' (cf: Model.a4p_types.editObjectFields.validations.expr)
        return eval(expr);
    };

    /**
     *
     * @param srvLocale
     * @param defaultSetterParam
     * @returns {*}
     */
    Model.firstOptionItem = function(srvLocale, defaultSetterParam) {
    	var optionList = srvLocale.translations[defaultSetterParam];

    	for(var key in optionList) {
    		return optionList[key];
    	}
    };

    Model.now = function () {
        var now = new Date();
        return a4pDateFormat(now);
    };

    Model.tomorrow = function () {
        var now = new Date();
        var dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), 0, 0, 0);
        return a4pDateFormat(dateFrom);
    };

    Model.tomorrowPrevHour = function () {
        var now = new Date();
        var dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours() -1, 0, 0, 0);
        return a4pDateFormat(dateFrom);
    };

    Model.nextHour = function () {
        var now = new Date();
        var dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
        return a4pDateFormat(dateFrom);
    };

    Model.nextNextHour = function () {
        var now = new Date();
        var dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 2, 0, 0, 0);
        return a4pDateFormat(dateTo);
    };

    Model.contactType = function () {
        return 'Contact';
    };
    Model.attachmentType = function () {
        return 'Attachment';
    };
    Model.dateEndFromStart = function (date_start, duration_hours, duration_minutes) {
        var dateStart = a4pDateParse(date_start);
        return a4pDateFormat(new Date(dateStart.getTime() + ((duration_hours*3600 + duration_minutes*60) * 1000)));
    };
    Model.dateStartFromEnd = function (date_start, date_end, duration_hours, duration_minutes) {
        var dateStart = a4pDateParse(date_start);
        var dateStop = a4pDateParse(date_end);
        if (dateStop.getTime() < dateStart.getTime()) {
            return a4pDateFormat(new Date(dateStop.getTime() - ((duration_hours*3600 + duration_minutes*60) * 1000)));
        }
        return date_start;
    };
    Model.diffHours = function (date_start, date_end) {
        var dateStart = a4pDateParse(date_start);
        var dateStop = a4pDateParse(date_end);
        return Math.floor((dateStop.getTime() - dateStart.getTime()) / 1000 / 3600);
    };
    Model.diffMinutesInHour = function (date_start, date_end) {
        var dateStart = a4pDateParse(date_start);
        var dateStop = a4pDateParse(date_end);
        var minutes = Math.floor((dateStop.getTime() - dateStart.getTime()) / 1000 / 60);
        return minutes % 60;
    };
    Model.httpPrefixUrl = function (url) {
        if (a4p.isUndefined(url) || (url.length == 0)) {
            return url;
        }
        var i = url.indexOf("http:");
        if (i == 0) {
            return url;
        }
        i = url.indexOf("https:");
        if (i == 0) {
            return url;
        }
        i = url.indexOf("//");
        if (i == 0) {
            return "http:" + url;
        }
        // TODO : take into account other forms of URL ?
        return "http://" + url;
    };
    Model.fileFirstMimetype = function (filename) {
        var extension = Model.fileExtension(filename);
        var mimetypes = Model.mimetypes[extension.toLowerCase()];
        if (a4p.isDefined(mimetypes)) {
            return mimetypes[0];
        }
        return 'application/octet-stream';// not text/plain as some software would transform ends of lines
    };
    Model.filePossibleMimetypes = function (filename) {
        var extension = Model.fileExtension(filename);
        var mimetypes = Model.mimetypes[extension.toLowerCase()];
        if (a4p.isDefined(mimetypes)) return mimetypes;
        return ['application/octet-stream', 'text/plain'];
    };
    Model.fileExtension = function (filename) {
        var i = filename.lastIndexOf(".");// Search LAST '.' not FIRST '.'
        if (i >= 0) return filename.substr(1 + i);
        return '';
    };
    Model.fileRootname = function (filename) {
        var i = filename.lastIndexOf(".");// Search LAST '.' not FIRST '.'
        if (i >= 0) return filename.substr(0, i);
        return filename;
    };
    Model.fileName = function (rootname, extension) {
        if (rootname && (rootname.length > 0)) {
            if (extension && (extension.length > 0)) {
                return rootname + '.' + extension;
            }
            return rootname;
        } else {
            if (extension && (extension.length > 0)) {
                return '.' + extension;
            }
            return '';
        }
    };
    Model.fileLastname = function (filename) {
        var i = filename.lastIndexOf("/");// Search LAST '/' not FIRST '/'
        if (i >= 0) {
            filename = filename.substr(1 + i);
        }
        i = filename.lastIndexOf("\\");// Search LAST '/' not FIRST '/'
        if (i >= 0) {
            filename = filename.substr(1 + i);
        }
        return filename;
    };
    Model.fileDirname = function (filename) {
        var i = filename.lastIndexOf("/");// Search LAST '/' not FIRST '/'
        var j = filename.lastIndexOf("\\");// Search LAST '/' not FIRST '/'
        if (i >= 0) {
            if (j > i) {
                filename = filename.substr(0, j);
            } else {
                filename = filename.substr(0, i);
            }
        } else if (j >= 0) {
            filename = filename.substr(0, j);
        }
        return '';
    };
    Model.dirPath = function () {
        return '/a4p/c4p/doc/sf/';
    };
    Model.filePath = function (dirPath, id, extension) {
        return normalizedPath(dirPath, id.dbid, extension);
    };
    Model.fileUrl = function (filePath) {
        // while waiting for the download of the file (called by addObject())
        return filePath;
    };

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Model;
})(); // Invoke the function immediately to create this class.
