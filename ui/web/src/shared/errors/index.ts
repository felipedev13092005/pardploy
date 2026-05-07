export class NotFoundError extends Error {
  status = 404
  constructor(message = 'Recurso no encontrado') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends Error {
  status = 400
  constructor(message = 'Solicitud inválida') {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends Error {
  status = 401
  constructor(message = 'No autorizado') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  status = 403
  constructor(message = 'Acceso denegado') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  status = 409
  constructor(message = 'Conflicto') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class UnprocessableEntityError extends Error {
  status = 422
  constructor(message = 'Datos no procesables') {
    super(message)
    this.name = 'UnprocessableEntityError'
  }
}

export class InternalServerError extends Error {
  status = 500
  constructor(message = 'Error interno del servidor') {
    super(message)
    this.name = 'InternalServerError'
  }
}
export const ErrorMap = {
  400: BadRequestError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
  422: UnprocessableEntityError,
  500: InternalServerError,
}

export type ErrorCode = keyof typeof ErrorMap

export function throwHttpError(status: ErrorCode, message?: string): never {
  const ErrorClass = ErrorMap[status] ?? InternalServerError
  throw new ErrorClass(message)
}
