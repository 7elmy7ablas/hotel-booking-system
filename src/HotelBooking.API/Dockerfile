FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["HotelBooking.API/HotelBooking.API.csproj", "HotelBooking.API/"]
COPY ["HotelBooking.Application/HotelBooking.Application.csproj", "HotelBooking.Application/"]
COPY ["HotelBooking.Domain/HotelBooking.Domain.csproj", "HotelBooking.Domain/"]
COPY ["HotelBooking.Infrastructure/HotelBooking.Infrastructure.csproj", "HotelBooking.Infrastructure/"]
RUN dotnet restore "HotelBooking.API/HotelBooking.API.csproj"
COPY . .
WORKDIR "/src/HotelBooking.API"
RUN dotnet build "HotelBooking.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HotelBooking.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HotelBooking.API.dll"]
