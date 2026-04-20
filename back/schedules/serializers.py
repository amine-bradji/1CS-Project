from rest_framework import serializers
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter

class SessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = '__all__'

    def get_teacher_name(self, obj):
        return getattr(obj.teacher, 'full_name', '') or f"{obj.teacher.first_name} {obj.teacher.last_name}".strip()

class SessionInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionInstance
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    registration_number = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'session_instance', 'student', 'student_name', 'registration_number', 'status']

    def get_student_name(self, obj):
        return getattr(obj.student, 'full_name', '') or f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_registration_number(self, obj):
        try:
            return obj.student.student_profile.registration_number or ''
        except Exception:
            return ''

class AbsenceCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceCounter
        fields = '__all__'
