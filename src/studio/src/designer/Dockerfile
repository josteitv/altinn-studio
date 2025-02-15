# studio frontend
FROM node:16.17.0-alpine3.16 AS generate-studio-frontend

WORKDIR /build

COPY ./src/designer/frontend/package.json .
COPY ./src/designer/frontend/yarn.lock .
COPY ./src/designer/frontend/.yarn/ ./.yarn/
COPY ./src/designer/frontend/.yarnrc.yml .

# Copy and install dependencies
COPY ./src/designer/frontend/shared/package.json ./shared/
COPY ./src/designer/frontend/app-development/package.json ./app-development/
COPY ./src/designer/frontend/ux-editor/package.json ./ux-editor/
COPY ./src/designer/frontend/dashboard/package.json ./dashboard/
COPY ./src/designer/frontend/packages/schema-editor/package.json ./packages/schema-editor/

RUN corepack enable
RUN yarn --immutable

# Copy shared, app-development, ux-editor and dashboard
COPY ./src/designer/frontend/shared/ ./shared/
COPY ./src/designer/frontend/app-development/ ./app-development/
COPY ./src/designer/frontend/ux-editor ./ux-editor/
COPY ./src/designer/frontend/dashboard/ ./dashboard/
COPY ./src/designer/frontend/packages/schema-editor/ ./packages/schema-editor/

# Build app-development
RUN yarn workspace app-development run build

# Build dashboard
RUN yarn workspace dashboard run build

# Create altinn-studio-frontend base image
FROM alpine as altinn-studio-frontend
WORKDIR /dist/
COPY --from=generate-studio-frontend /build/dist/app-development/app-development.js .
COPY --from=generate-studio-frontend /build/dist/app-development/1.app-development.js .
COPY --from=generate-studio-frontend /build/dist/app-development/2.app-development.js .
COPY --from=generate-studio-frontend /build/dist/app-development/3.app-development.js .
COPY --from=generate-studio-frontend /build/dist/app-development/4.app-development.js .
COPY --from=generate-studio-frontend /build/dist/app-development/editor.worker.js .
COPY --from=generate-studio-frontend /build/dist/app-development/ts.worker.js .
COPY --from=generate-studio-frontend /build/dist/app-development/app-development.css .
COPY --from=generate-studio-frontend /build/dist/dashboard/dashboard.js .
COPY --from=generate-studio-frontend /build/dist/dashboard/dashboard.css .

FROM node:16.17.0-alpine3.16 AS generate-designer-js
WORKDIR /app
COPY src/designer/backend/package.json .
COPY src/designer/backend/yarn.lock .
COPY src/designer/backend/.yarn ./.yarn
COPY src/designer/backend/.yarnrc.yml .

RUN corepack enable
RUN yarn --immutable

COPY src/designer/backend .
RUN yarn run gulp build

FROM mcr.microsoft.com/dotnet/sdk:6.0.401-alpine3.16 AS build
WORKDIR /build
COPY src/designer/Designer.sln ./
COPY src/designer/backend ./designer/
COPY src/designer/DataModeling ./DataModeling/
COPY --from=generate-designer-js ./app/wwwroot ./designer/wwwroot

RUN dotnet build designer/Designer.csproj -c Release -o /app_output
RUN dotnet publish designer/Designer.csproj -c Release -o /app_output
RUN rm -f /app_output/Altinn.Studio.Designer.staticwebassets.runtime.json


FROM mcr.microsoft.com/dotnet/aspnet:6.0.9-alpine3.16 AS final
EXPOSE 80
WORKDIR /app
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    DOTNET_RUNNING_IN_CONTAINER=true
RUN apk add --no-cache icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib
COPY --from=build /app_output .
COPY --from=altinn-studio-frontend /dist/app-development.js ./wwwroot/designer/js/react/app-development.js
COPY --from=altinn-studio-frontend /dist/1.app-development.js ./wwwroot/designer/js/react/1.app-development.js
COPY --from=altinn-studio-frontend /dist/2.app-development.js ./wwwroot/designer/js/react/2.app-development.js
COPY --from=altinn-studio-frontend /dist/3.app-development.js ./wwwroot/designer/js/react/3.app-development.js
COPY --from=altinn-studio-frontend /dist/4.app-development.js ./wwwroot/designer/js/react/4.app-development.js
COPY --from=altinn-studio-frontend /dist/editor.worker.js ./wwwroot/designer/js/react/editor.worker.js
COPY --from=altinn-studio-frontend /dist/ts.worker.js ./wwwroot/designer/js/react/ts.worker.js
COPY --from=altinn-studio-frontend /dist/app-development.css ./wwwroot/designer/css/react/app-development.css
COPY --from=altinn-studio-frontend /dist/dashboard.js ./wwwroot/designer/js/react/dashboard.js
COPY --from=altinn-studio-frontend /dist/dashboard.css ./wwwroot/designer/css/react/dashboard.css

## Copying app template
## TODO: find out how to reference files outside docker context
COPY /AppTemplates/AspNet ./Templates/AspNet

COPY src/designer/backend/Languages/ini ./Languages

COPY src/designer/backend/Migration ./Migration

ENTRYPOINT ["dotnet", "Altinn.Studio.Designer.dll"]
