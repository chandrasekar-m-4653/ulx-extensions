# Backstage v3 API reference

Call Zoho Backstage through `app.api`. Confirm the operation id, path-parameter order, query names, and response fields on the endpoint page before generating a call. Start from the [Backstage API v3 introduction](https://www.zoho.com/backstage/api/v3/introduction.html).

`app.api` is host-backed. It does not add `whiteListedDomains` entries. External calls use `app.request` and must update the manifest.

## Call shape

```javascript
const result = await app.api.<operationId>(...pathParams, query);
```

- Pass path parameters other than the host-injected `portalId` positionally, in the order documented for that endpoint.
- Put query parameters in the final object. Use the documented names as-is: `page`, `per_page`, `sort_by`, `sort_order`, `ticket_id`, and `status`. Do not camel-case them (`perPage` is invalid).
- Put create, update, and delete payloads under `body` in that same final object.
- The return value is the raw REST JSON body. Do not read `response.data`, `response.body`, or another wrapper.

```javascript
const event = await app.api.getEvent(app.eventId);

const events = await app.api.listEvents({
  status: "live",
  sort_by: "start_date",
  sort_order: "asc",
  page: 1,
  per_page: 50
});

const attendees = await app.api.listAttendees(app.eventId, {
  page: 1,
  per_page: 100,
  ticket_id: "12345678"
});

const exhibitor = await app.api.createExhibitor(app.eventId, {
  body: {
    exhibitor_category_id: categoryId,
    company_name: companyName,
    contact: { first_name: firstName, email }
  }
});
```

Operation ids above are examples. Use the id exposed by the frame client for the endpoint you are calling.

## List responses

List endpoints return pagination plus a resource-named array. See [Get all events](https://www.zoho.com/backstage/api/v3/get-all-events.html) and [Get all attendees](https://www.zoho.com/backstage/api/v3/get-all-attendees.html).

```javascript
const { pagination, events } = await app.api.listEvents({
  status: "live",
  page: 1,
  per_page: 50
});

const { pagination: attendeePage, attendees } = await app.api.listAttendees(
  app.eventId,
  { page: 1, per_page: 100 }
);
```

```json
{
  "pagination": {
    "total_count": 5,
    "page": 1,
    "per_page": 100,
    "total_pages": 1,
    "has_more_items": false
  },
  "attendees": []
}
```

- `pagination.total_count`: records across all pages.
- `pagination.page`: current page.
- `pagination.per_page`: page size from the request.
- `pagination.total_pages`: page count for that page size.
- `pagination.has_more_items`: whether another page exists.
- The array key is the resource name from the endpoint, such as `events`, `attendees`, `orders`, or `ticket_classes`.

Request the next page with the same filters and `page: pagination.page + 1` while `pagination.has_more_items` is true. Pagination behavior is described in the [pagination reference](https://www.zoho.com/backstage/api/v3/pagination.html).

## Single-resource responses

A single-resource GET returns the resource object itself. See [Get a specific event](https://www.zoho.com/backstage/api/v3/get-a-specific-event.html).

```javascript
const event = await app.api.getEvent(app.eventId);
const name = event.name;
const status = event.status_string;
```

Read field names from that endpoint page. Status and type fields are commonly exposed as both a number (`status`, `event_type`) and a string (`status_string`, `event_type_string`).
