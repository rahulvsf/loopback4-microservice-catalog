import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {Attachment, Attendee, Event, EventAttendeeView} from '../models';
import {PermissionKey} from '../models/enums/permission-key.enum';
import {EventDTO} from '../models/event.dto';
import {
  AttachmentRepository,
  AttendeeRepository,
  EventRepository,
  EventAttendeeViewRepository,
} from '../repositories';
import {ValidatorService} from '../services/validator.service';
import {ErrorKeys} from '../models/enums/error-keys';
import {STATUS_CODE, CONTENT_TYPE} from '@sourceloop/core';
import {FreeBusyDTO} from '../models/free-busy.dto';
import {EventService} from '../services';

const basePath = '/events';

export class EventController {
  constructor(
    @repository(EventRepository)
    public eventRepository: EventRepository,
    @repository(AttendeeRepository)
    public attendeeRepository: AttendeeRepository,
    @repository(AttachmentRepository)
    public attachmentRepository: AttachmentRepository,
    @repository(EventAttendeeViewRepository)
    public eventAttendeeViewRepository: EventAttendeeViewRepository,
    @service(ValidatorService) public validatorService: ValidatorService,
    @service(EventService) public eventService: EventService,
  ) {}

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.CreateEvent])
  @post(basePath, {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Event model instance',
        content: {[CONTENT_TYPE.JSON]: {schema: getModelSchemaRef(Event)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(EventDTO, {
            title: 'NewEvent',
            exclude: ['id'],
          }),
        },
      },
    })
    req: Omit<EventDTO, 'id'>,
  ): Promise<Event> {
    const {calendarId, parentEventId, attendees, attachments} = req;
    const isCalendar = await this.validatorService.calendarExists(calendarId);
    if (!isCalendar) {
      throw new HttpErrors.NotFound(ErrorKeys.CalendarNotExist);
    }

    if (parentEventId) {
      const isEvent = await this.validatorService.eventExists(parentEventId);
      if (!isEvent) {
        throw new HttpErrors.NotFound(ErrorKeys.EventNotExist);
      }
    }
    delete req.attendees;
    delete req.attachments;

    const event = await this.eventRepository.create(req);
    if (event?.id) {
      const eventId = event.id;
      if (attendees) {
        event.attendees = await Promise.all(
          attendees.map(async (attendee: Attendee) => {
            attendee.eventId = eventId;
            return this.eventRepository.attendees(eventId).create(attendee);
          }),
        );
      }
      if (attachments) {
        event.attachments = await Promise.all(
          attachments.map(async (attachment: Attachment) => {
            attachment.eventId = eventId;
            return this.eventRepository.attachments(eventId).create(attachment);
          }),
        );
      }
    }
    return event;
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.ViewEvent, PermissionKey.ViewAttendee])
  @get('/events/freeBusy')
  async getFeeBusyStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FreeBusyDTO, {
            title: 'FreeBusy request',
          }),
        },
      },
    })
    freeBusyDTO: FreeBusyDTO,
  ) {
    const {timeMin, timeMax} = freeBusyDTO;
    if (
      !this.eventService.validateDateForTimeZone(timeMin) ||
      !this.eventService.validateDateForTimeZone(timeMax) ||
      !this.validatorService.minMaxTime(timeMin, timeMax)
    ) {
      throw new HttpErrors.UnprocessableEntity(ErrorKeys.DateInvalid);
    }

    const response = {
      timeMax,
      timeMin,
      calendars: {},
    };

    const calendars = [];
    for (const item of freeBusyDTO.items) {
      const id = item.id;
      const busyDetailsObj = await this.eventService.getBusyDetails(
        item.id,
        timeMax,
        timeMin,
      );

      const calendar = {
        [id]: busyDetailsObj,
      };
      calendars.push(calendar);
    }
    response.calendars = calendars;
    return response;
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.ViewEvent])
  @get(`${basePath}/count`, {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Event model count',
        content: {[CONTENT_TYPE.JSON]: {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Event) where?: Where<Event>): Promise<Count> {
    return this.eventRepository.count(where);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.ViewEvent])
  @get(basePath, {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Array of Event model instances',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Event, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(EventAttendeeView) filter?: Filter<EventAttendeeView>,
  ): Promise<Event[]> {
    const whereClause: Filter = {
      where: filter?.where ?? {},
    };

    const events = await this.eventAttendeeViewRepository.find(whereClause);

    const eventIds: string[] = [];
    events.forEach(event => {
      if (event.id) {
        eventIds.push(event.id);
      }
    });

    if (filter) {
      filter.where = {id: {inq: eventIds}};
    } else {
      filter = {where: {id: {inq: eventIds}}};
    }
    return this.eventRepository.find(filter);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.UpdateEvent])
  @patch(basePath, {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Event PATCH success count',
        content: {[CONTENT_TYPE.JSON]: {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(Event, {partial: true}),
        },
      },
    })
    event: Event,
    @param.where(Event) where?: Where<Event>,
  ): Promise<Count> {
    return this.eventRepository.updateAll(event, where);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.ViewEvent])
  @get(`${basePath}/{id}`, {
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Event model instance',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: getModelSchemaRef(Event, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Event, {exclude: 'where'})
    filter?: FilterExcludingWhere<Event>,
  ): Promise<Event> {
    return this.eventRepository.findById(id, filter);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.UpdateEvent])
  @patch(`${basePath}/{id}`, {
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'Event PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(Event, {partial: true}),
        },
      },
    })
    event: Event,
  ): Promise<void> {
    await this.eventRepository.updateById(id, event);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.UpdateEvent])
  @put(`${basePath}/{id}`, {
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'Event PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() event: Event,
  ): Promise<void> {
    return this.eventRepository.replaceById(id, event);
  }

  @authenticate(STRATEGY.BEARER, {
    passReqToCallback: true,
  })
  @authorize([PermissionKey.DeleteEvent])
  @del(`${basePath}/{id}`, {
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'Event DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.eventRepository.deleteById(id);
  }
}
