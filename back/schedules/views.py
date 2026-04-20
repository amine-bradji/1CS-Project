from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter
from .serializers import (
    SessionSerializer,
    SessionInstanceSerializer,
    AttendanceRecordSerializer,
    AbsenceCounterSerializer
)
from .permissions import IsTeacherOrAdmin

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return Session.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return Session.objects.filter(teacher=user)
        # If student, filter by their profile year, specialty, and group
        if getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                from django.db.models import Q
                base_qs = Session.objects.filter(
                    year=str(profile.year)
                ).filter(
                    Q(specialty=profile.speciality) | Q(specialty='N/A') | Q(specialty__isnull=True) | Q(specialty='')
                )
                valid_ids = [
                    s.id for s in base_qs
                    if not s.assigned_groups or profile.group in s.assigned_groups
                ]
                return Session.objects.filter(id__in=valid_ids)
            except Exception:
                return Session.objects.none()

        return Session.objects.all()

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Return all students whose group is in session.assigned_groups."""
        session = self.get_object()
        from accounts.models import StudentProfile
        from django.contrib.auth import get_user_model
        User = get_user_model()

        groups = session.assigned_groups or []
        if groups:
            profiles = StudentProfile.objects.filter(group__in=groups).select_related('user')
        else:
            profiles = StudentProfile.objects.none()

        students_data = [
            {
                'id': p.user.id,
                'full_name': getattr(p.user, 'full_name', '') or f"{p.user.first_name} {p.user.last_name}".strip(),
                'registration_number': p.registration_number or '',
                'group': p.group or '',
            }
            for p in profiles
        ]
        return Response(students_data)

    @action(detail=True, methods=['post'], url_path='start_attendance')
    def start_attendance(self, request, pk=None):
        """
        Create (or get) a SessionInstance for today, then create AttendanceRecord
        rows for every student in the session's assigned groups.
        Returns instance_id and the full student list with their current status.
        """
        session = self.get_object()
        today = timezone.localdate()

        instance, _ = SessionInstance.objects.get_or_create(
            session=session,
            date=today,
            defaults={'status': 'active', 'teacher_note': ''}
        )
        # Mark active if it was upcoming
        if instance.status == 'upcoming':
            instance.status = 'active'
            instance.save(update_fields=['status'])

        from accounts.models import StudentProfile
        groups = session.assigned_groups or []
        if groups:
            profiles = StudentProfile.objects.filter(group__in=groups).select_related('user')
        else:
            profiles = []

        students_data = []
        for p in profiles:
            record, _ = AttendanceRecord.objects.get_or_create(
                session_instance=instance,
                student=p.user,
                defaults={'status': 'unmarked'}
            )
            students_data.append({
                'record_id': record.id,
                'student_id': p.user.id,
                'full_name': getattr(p.user, 'full_name', '') or f"{p.user.first_name} {p.user.last_name}".strip(),
                'registration_number': p.registration_number or '',
                'group': p.group or '',
                'status': record.status,
            })

        return Response({
            'instance_id': instance.id,
            'session_id': session.id,
            'date': str(today),
            'status': instance.status,
            'students': students_data,
        }, status=status.HTTP_200_OK)


class SessionInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = SessionInstanceSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return SessionInstance.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return SessionInstance.objects.filter(session__teacher=user)
        if getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                from django.db.models import Q
                base_qs = SessionInstance.objects.filter(
                    session__year=str(profile.year)
                ).filter(
                    Q(session__specialty=profile.speciality) | Q(session__specialty='N/A') | Q(session__specialty__isnull=True) | Q(session__specialty='')
                )
                valid_ids = [
                    i.id for i in base_qs
                    if not i.session.assigned_groups or profile.group in i.session.assigned_groups
                ]
                return SessionInstance.objects.filter(id__in=valid_ids)
            except Exception:
                return SessionInstance.objects.none()

        return SessionInstance.objects.all()

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return AttendanceRecord.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return AttendanceRecord.objects.filter(session_instance__session__teacher=user)
        # Students only see their own attendance
        return AttendanceRecord.objects.filter(student=user)

class AbsenceCounterViewSet(viewsets.ModelViewSet):
    serializer_class = AbsenceCounterSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return AbsenceCounter.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return AbsenceCounter.objects.filter(session__teacher=user)
        # Students only see their own counters
        return AbsenceCounter.objects.filter(student=user)
